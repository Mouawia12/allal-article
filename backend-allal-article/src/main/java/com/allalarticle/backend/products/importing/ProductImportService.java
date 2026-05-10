package com.allalarticle.backend.products.importing;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.integration.ai.service.AiSettingsService;
import com.allalarticle.backend.products.CategoryRepository;
import com.allalarticle.backend.products.ProductRepository;
import com.allalarticle.backend.products.ProductService;
import com.allalarticle.backend.products.ProductUnitRepository;
import com.allalarticle.backend.products.dto.ProductRequest;
import com.allalarticle.backend.products.entity.Category;
import com.allalarticle.backend.products.entity.ProductUnit;
import com.allalarticle.backend.products.importing.dto.ImportedProductPayload;
import com.allalarticle.backend.products.importing.dto.ProductImportConfirmRequest;
import com.allalarticle.backend.products.importing.dto.ProductImportJobResponse;
import com.allalarticle.backend.tenant.TenantContext;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import jakarta.annotation.PreDestroy;

/**
 * Orchestrates AI-driven product import: kicks off async parsing, exposes
 * progress, and (on confirm) persists the reviewed products via
 * {@link ProductService#bulkCreate}. Auto-creates missing categories and
 * units so the user does not have to set them up beforehand.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductImportService {

    private final ProductImportJobStore jobStore;
    private final FileTextExtractor extractor;
    private final OpenAiChatClient chatClient;
    private final AiSettingsService aiSettings;
    private final ProductService productService;
    private final ProductRepository productRepo;
    private final ProductUnitRepository unitRepo;
    private final CategoryRepository categoryRepo;
    private final ObjectMapper objectMapper;

    /** Worker pool for AI calls. Bounded so concurrent uploads do not exhaust the API. */
    private final ExecutorService worker = Executors.newFixedThreadPool(2, runnable -> {
        Thread thread = new Thread(runnable, "product-import-worker");
        thread.setDaemon(true);
        return thread;
    });

    @PreDestroy
    public void shutdown() {
        worker.shutdownNow();
    }

    public ProductImportJobResponse start(MultipartFile file, Authentication auth) {
        FileTextExtractor.ExtractedContent content = extractor.extract(file);

        String schema = TenantContext.get();
        if (schema == null || schema.isBlank()) {
            throw new AppException(ErrorCode.UNAUTHORIZED, "لا يوجد سياق مستأجر", HttpStatus.UNAUTHORIZED);
        }

        ProductImportJob job = jobStore.create(schema, extractUserId(auth),
                content.filename(), content.kind().name().toLowerCase(Locale.ROOT));

        worker.submit(() -> processJob(job, content));
        return job.snapshot();
    }

    public ProductImportJobResponse poll(String jobId) {
        return jobStore.require(jobId, requireSchema()).snapshot();
    }

    @Transactional
    public ProductImportJobResponse confirm(String jobId, ProductImportConfirmRequest request, Authentication auth) {
        ProductImportJob job = jobStore.require(jobId, requireSchema());
        if (job.stage() != ProductImportJob.Stage.READY) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "لا يمكن الحفظ قبل اكتمال الاستخراج", HttpStatus.BAD_REQUEST);
        }
        List<ImportedProductPayload> items = request != null && request.items() != null && !request.items().isEmpty()
                ? request.items()
                : job.items();
        if (items.isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "لا توجد أصناف للحفظ", HttpStatus.BAD_REQUEST);
        }

        List<ProductRequest> requests = items.stream().map(this::toProductRequest).toList();
        Map<String, Object> summary = productService.bulkCreate(requests, auth);
        job.markDone(summary);
        return job.snapshot();
    }

    public void cancel(String jobId) {
        jobStore.remove(jobId);
    }

    // ── Async pipeline ────────────────────────────────────────────────────────

    private void processJob(ProductImportJob job, FileTextExtractor.ExtractedContent content) {
        TenantContext.set(job.tenantSchema());
        try {
            job.update(ProductImportJob.Stage.EXTRACTING, 25, "تم استخراج محتوى الملف");

            String apiKey = aiSettings.resolveOpenAiApiKey();
            String model = chooseModel(content.isImage());
            String systemPrompt = buildSystemPrompt();
            String userPrompt = buildUserPrompt(content);

            job.update(ProductImportJob.Stage.AI_PROCESSING, 55,
                    "جاري تحليل المحتوى بالذكاء الاصطناعي…");
            String raw = chatClient.complete(apiKey, model, systemPrompt, userPrompt,
                    content.isImage() ? content.imageDataUrl() : null);

            job.update(ProductImportJob.Stage.PARSED, 85, "تم استلام الاستجابة، جاري التحقق…");
            JsonNode root = objectMapper.readTree(raw);
            boolean relevant = root.path("relevant").asBoolean(true);
            if (!relevant) {
                String reason = root.path("reason").asText(
                        "لم يتم العثور على بيانات أصناف في هذا الملف");
                job.markIrrelevant(reason);
                return;
            }

            JsonNode productsNode = root.path("products");
            if (!productsNode.isArray() || productsNode.isEmpty()) {
                job.markIrrelevant("الذكاء الاصطناعي لم يستخرج أي صنف من الملف");
                return;
            }

            List<ImportedProductPayload> items = objectMapper.convertValue(
                    productsNode, new TypeReference<List<ImportedProductPayload>>() {});
            items = items.stream().filter(p -> p != null && p.name() != null && !p.name().isBlank()).toList();
            if (items.isEmpty()) {
                job.markIrrelevant("لم يتم العثور على أصناف صالحة في الملف");
                return;
            }
            items = ensureUniqueSkus(items);
            job.markReady(items);
        } catch (AppException e) {
            log.warn("Product import job {} failed: {}", job.jobId(), e.getMessage());
            job.markFailed(e.getMessage());
        } catch (Exception e) {
            log.error("Product import job {} crashed", job.jobId(), e);
            job.markFailed("خطأ غير متوقع أثناء المعالجة");
        } finally {
            TenantContext.clear();
        }
    }

    private String chooseModel(boolean needsVision) {
        // GPT-4o family handles both text and vision in one model, so we use
        // the configured chat model for both. Future improvement: a separate
        // vision-model setting if a tenant wants to override.
        String model = aiSettings.currentChatModel();
        return model != null && !model.isBlank() ? model : "gpt-4o";
    }

    private String buildSystemPrompt() {
        return """
                You are a strict product-catalog extraction assistant for an Arabic ERP system.
                Your only job is to read a file (text content extracted from PDF/Word/Excel/CSV, or an image)
                and return a JSON object describing the products it lists.

                Rules:
                - Output ONLY a JSON object, no extra prose.
                - Top-level keys: "relevant" (boolean), "reason" (string when relevant=false), "products" (array).
                - Set "relevant": false if the file is clearly not a product list (e.g. a contract, novel, ID card,
                  random photo, invoice without item breakdown, marketing page with no product details).
                  In that case provide a short Arabic "reason" and an empty "products" array.
                - When relevant, each product object MUST have: name (string, Arabic if source is Arabic),
                  sku (string, generate one if missing — short uppercase, max 20 chars),
                  category (string, infer if missing),
                  baseUnit (string, e.g. "قطعة", "كجم", "متر", "علبة"),
                  unitsPerPackage (number, default 1),
                  packageUnit (string, e.g. "كرطون", "علبة", or null),
                  currentPriceAmount (number or null),
                  minStockQty (number, default 0),
                  barcode (string or null),
                  description (string or null),
                  extraUnits (array of {unit, conversionFactor, price, barcode}; empty if none),
                  variants (array of {sku, label, price, stock, barcode}; empty if none).
                - DO NOT invent prices, barcodes, or stock numbers. If the source does not state a value, set null
                  (or 0 for minStockQty).
                - Detect variants when the file lists the same product across sizes/colors/flavours/grades.
                - Detect extra units when a row mentions multiple units of the same product (e.g. علبة + كرطون).
                - Never include image fields. Images are added later by the user.
                - Keep the products list bounded to at most 200 items.
                """;
    }

    private String buildUserPrompt(FileTextExtractor.ExtractedContent content) {
        if (content.isImage()) {
            return "هذه صورة قائمة أصناف أو فاتورة. استخرج كل صنف ظاهر فيها واتبع القواعد أعلاه. اسم الملف: "
                    + content.filename();
        }
        return "اسم الملف: " + content.filename()
                + "\n\nالمحتوى المستخرج:\n---\n" + (content.text() == null ? "" : content.text())
                + "\n---\nاستخرج الأصناف منه وفق القواعد أعلاه.";
    }

    private List<ImportedProductPayload> ensureUniqueSkus(List<ImportedProductPayload> items) {
        Map<String, Integer> seen = new HashMap<>();
        List<ImportedProductPayload> result = new ArrayList<>(items.size());
        for (ImportedProductPayload p : items) {
            String sku = p.sku() != null && !p.sku().isBlank() ? p.sku().trim() : autoSku(p.name());
            int copy = seen.merge(sku, 1, Integer::sum);
            if (copy > 1 || productRepo.existsBySku(sku)) {
                sku = sku + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
                seen.put(sku, 1);
            }
            result.add(new ImportedProductPayload(
                    sku, p.name(), p.category(), p.baseUnit(), p.unitsPerPackage(),
                    p.packageUnit(), p.currentPriceAmount(), p.minStockQty(),
                    p.barcode(), p.description(), p.extraUnits(), p.variants()));
        }
        return result;
    }

    private String autoSku(String name) {
        String base = name == null ? "PRD" : name.trim().toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9\\u0600-\\u06FF]+", "-");
        if (base.length() > 12) base = base.substring(0, 12);
        return (base.isBlank() ? "PRD" : base) + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }

    // ── Confirm: convert payload → ProductRequest ─────────────────────────────

    private ProductRequest toProductRequest(ImportedProductPayload payload) {
        Long categoryId = resolveCategoryId(payload.category());
        Long unitId = resolveUnitId(payload.baseUnit());

        BigDecimal unitsPerPackage = payload.unitsPerPackage() != null
                ? payload.unitsPerPackage() : BigDecimal.ONE;
        BigDecimal minStockQty = payload.minStockQty() != null
                ? payload.minStockQty() : BigDecimal.ZERO;

        return new ProductRequest(
                payload.sku(),
                payload.name(),
                categoryId,
                unitId,
                blankToNull(payload.barcode()),
                unitsPerPackage,
                payload.currentPriceAmount(),
                minStockQty,
                blankToNull(payload.description()),
                "active"
        );
    }

    private Long resolveCategoryId(String name) {
        if (name == null || name.isBlank()) return null;
        String trimmed = name.trim();
        return categoryRepo.findByNameIgnoreCase(trimmed)
                .map(Category::getId)
                .orElseGet(() -> {
                    Category created = Category.builder()
                            .name(trimmed)
                            .active(true)
                            .sortOrder(0)
                            .build();
                    return categoryRepo.save(created).getId();
                });
    }

    private Long resolveUnitId(String name) {
        String trimmed = name != null && !name.isBlank() ? name.trim() : "قطعة";
        return unitRepo.findByNameIgnoreCase(trimmed)
                .map(ProductUnit::getId)
                .orElseGet(() -> {
                    ProductUnit created = ProductUnit.builder()
                            .name(trimmed)
                            .symbol(trimmed)
                            .build();
                    return unitRepo.save(created).getId();
                });
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String requireSchema() {
        String schema = TenantContext.get();
        if (schema == null || schema.isBlank()) {
            throw new AppException(ErrorCode.UNAUTHORIZED, "لا يوجد سياق مستأجر", HttpStatus.UNAUTHORIZED);
        }
        return schema;
    }

    private Long extractUserId(Authentication auth) {
        if (auth instanceof UsernamePasswordAuthenticationToken t
                && t.getDetails() instanceof Claims claims) {
            return claims.get("userId", Long.class);
        }
        return null;
    }
}
