package com.allalarticle.backend.products;

import com.allalarticle.backend.audit.AuditLogService;
import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.common.response.PageResponse;
import com.allalarticle.backend.email.EmailNotificationService;
import com.allalarticle.backend.products.dto.ProductPriceHistoryResponse;
import com.allalarticle.backend.products.dto.ProductRequest;
import com.allalarticle.backend.products.dto.ProductResponse;
import com.allalarticle.backend.products.entity.Product;
import com.allalarticle.backend.products.entity.ProductPriceHistory;
import com.allalarticle.backend.users.TenantUserRepository;
import com.allalarticle.backend.users.entity.TenantUser;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepo;
    private final CategoryRepository categoryRepo;
    private final ProductUnitRepository unitRepo;
    private final ProductPriceHistoryRepository priceHistoryRepo;
    private final TenantUserRepository userRepo;
    private final AuditLogService auditLogService;
    private final EmailNotificationService emailNotificationService;

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> list(String q, Long categoryId, Pageable pageable) {
        var page = (q != null && !q.isBlank())
                ? productRepo.search(q.trim(), pageable)
                : (categoryId != null)
                    ? productRepo.findByCategory(categoryId, pageable)
                    : productRepo.findByDeletedAtIsNull(pageable);
        return PageResponse.from(page.map(ProductResponse::from));
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        return productRepo.findById(id)
                .filter(p -> p.getDeletedAt() == null)
                .map(ProductResponse::from)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Product not found", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public List<ProductPriceHistoryResponse> getPriceHistory(Long productId) {
        var product = productRepo.findById(productId)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Product not found", HttpStatus.NOT_FOUND));

        var history = priceHistoryRepo.findByProductIdOrderByEffectiveAtDescCreatedAtDesc(productId);
        if (history.isEmpty() && product.getCurrentPriceAmount() != null) {
            priceHistoryRepo.save(ProductPriceHistory.builder()
                    .product(product)
                    .newPriceAmount(product.getCurrentPriceAmount())
                    .priceCurrency(product.getPriceCurrency() != null ? product.getPriceCurrency() : "DZD")
                    .changeReason("السعر الحالي قبل تفعيل سجل الأسعار")
                    .sourceType("current_price_baseline")
                    .sourceId(product.getId())
                    .build());
            history = priceHistoryRepo.findByProductIdOrderByEffectiveAtDescCreatedAtDesc(productId);
        }

        return history
                .stream()
                .map(ProductPriceHistoryResponse::from)
                .toList();
    }

    @Transactional
    public ProductResponse create(ProductRequest req, Authentication auth) {
        if (productRepo.existsBySku(req.sku())) {
            throw new AppException(ErrorCode.CONFLICT, "SKU already exists", HttpStatus.CONFLICT);
        }
        var unit = unitRepo.findById(req.baseUnitId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Unit not found", HttpStatus.NOT_FOUND));

        var builder = Product.builder()
                .sku(req.sku())
                .name(req.name())
                .baseUnit(unit)
                .barcode(req.barcode())
                .currentPriceAmount(req.currentPriceAmount())
                .description(req.description())
                .status(req.status() != null ? req.status() : "active");

        if (req.unitsPerPackage() != null) builder.unitsPerPackage(req.unitsPerPackage());
        if (req.minStockQty()     != null) builder.minStockQty(req.minStockQty());
        if (req.categoryId()      != null) {
            var cat = categoryRepo.findById(req.categoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Category not found", HttpStatus.NOT_FOUND));
            builder.category(cat);
        }

        var saved = productRepo.save(builder.build());
        recordPriceHistory(saved, null, saved.getCurrentPriceAmount(),
                "سعر ابتدائي عند إنشاء الصنف", "product_create", saved.getId(), auth);
        auditLogService.log(extractUserId(auth), "product", saved.getId(),
                "product_created",
                "إضافة صنف — " + saved.getName(),
                saved.getSku(),
                "إدارة",
                Map.of(
                        "productId", saved.getId(),
                        "productName", saved.getName(),
                        "sku", saved.getSku(),
                        "price", saved.getCurrentPriceAmount() != null ? saved.getCurrentPriceAmount() : BigDecimal.ZERO
                ));
        notifySafely(() -> emailNotificationService.onProductCreated(saved, actorName(auth)));
        return ProductResponse.from(saved);
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest req, Authentication auth) {
        var product = productRepo.findById(id)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Product not found", HttpStatus.NOT_FOUND));

        if (!product.getSku().equals(req.sku()) && productRepo.existsBySku(req.sku())) {
            throw new AppException(ErrorCode.CONFLICT, "SKU already exists", HttpStatus.CONFLICT);
        }

        var unit = unitRepo.findById(req.baseUnitId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Unit not found", HttpStatus.NOT_FOUND));

        BigDecimal previousPrice = product.getCurrentPriceAmount();

        product.setSku(req.sku());
        product.setName(req.name());
        product.setBaseUnit(unit);
        product.setBarcode(req.barcode());
        product.setCurrentPriceAmount(req.currentPriceAmount());
        product.setDescription(req.description());
        if (req.status()          != null) product.setStatus(req.status());
        if (req.unitsPerPackage() != null) product.setUnitsPerPackage(req.unitsPerPackage());
        if (req.minStockQty()     != null) product.setMinStockQty(req.minStockQty());
        if (req.categoryId()      != null) {
            var cat = categoryRepo.findById(req.categoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Category not found", HttpStatus.NOT_FOUND));
            product.setCategory(cat);
        } else {
            product.setCategory(null);
        }

        var saved = productRepo.save(product);
        if (priceChanged(previousPrice, saved.getCurrentPriceAmount())) {
            recordPriceHistory(saved, previousPrice, saved.getCurrentPriceAmount(),
                    "تعديل سعر الصنف", "product_update", saved.getId(), auth);
            auditLogService.log(extractUserId(auth), "product", saved.getId(),
                    "product_price_changed",
                    "تغيير سعر صنف — " + saved.getName(),
                    saved.getSku(),
                    "إدارة",
                    Map.of(
                            "productId", saved.getId(),
                            "productName", saved.getName(),
                            "sku", saved.getSku(),
                            "previousPrice", previousPrice != null ? previousPrice : BigDecimal.ZERO,
                            "newPrice", saved.getCurrentPriceAmount() != null ? saved.getCurrentPriceAmount() : BigDecimal.ZERO
                    ));
            BigDecimal prev = previousPrice;
            BigDecimal next = saved.getCurrentPriceAmount();
            notifySafely(() -> emailNotificationService.onProductPriceChanged(saved, prev, next, actorName(auth)));
        }
        return ProductResponse.from(saved);
    }

    private void notifySafely(Runnable r) {
        try {
            r.run();
        } catch (Exception e) {
            // Email failures must never break the business operation.
        }
    }

    private String actorName(Authentication auth) {
        Long userId = extractUserId(auth);
        if (userId == null) return "النظام";
        try {
            TenantUser u = userRepo.findById(userId).orElse(null);
            return u != null ? u.getName() : "النظام";
        } catch (Exception e) {
            return "النظام";
        }
    }

    /**
     * Bulk-create products. Each row is created in its own transaction-equivalent so that
     * one bad row does not abort the whole batch. Sends a single summary email at the end
     * (independent of per-row product.created emails — those are suppressed during bulk).
     */
    public Map<String, Object> bulkCreate(List<ProductRequest> requests, Authentication auth) {
        if (requests == null || requests.isEmpty()) {
            return Map.of("created", 0, "failed", 0, "items", List.of());
        }

        List<Map<String, Object>> results = new ArrayList<>();
        List<String[]> csv = new ArrayList<>();
        csv.add(new String[]{"#", "SKU", "الاسم", "السعر", "الحالة", "ملاحظات"});
        List<String> sample = new ArrayList<>();
        int created = 0;
        int failed = 0;

        for (int i = 0; i < requests.size(); i++) {
            ProductRequest req = requests.get(i);
            Map<String, Object> row = new HashMap<>();
            row.put("index", i + 1);
            row.put("sku", req != null ? req.sku() : null);
            row.put("name", req != null ? req.name() : null);
            try {
                ProductResponse saved = createSilently(req, auth);
                row.put("status", "created");
                row.put("productId", saved.id());
                created++;
                if (sample.size() < 8) {
                    sample.add((sample.size() + 1) + ". " + safeStr(saved.name()) + " — " +
                            safeStr(saved.sku()) + (saved.currentPriceAmount() != null
                                ? " (" + saved.currentPriceAmount() + ")" : ""));
                }
                csv.add(new String[]{
                        String.valueOf(i + 1),
                        safeStr(saved.sku()),
                        safeStr(saved.name()),
                        saved.currentPriceAmount() != null ? saved.currentPriceAmount().toPlainString() : "",
                        "تمت الإضافة",
                        ""
                });
            } catch (Exception e) {
                failed++;
                row.put("status", "failed");
                row.put("error", e.getMessage());
                csv.add(new String[]{
                        String.valueOf(i + 1),
                        req != null ? safeStr(req.sku()) : "",
                        req != null ? safeStr(req.name()) : "",
                        req != null && req.currentPriceAmount() != null ? req.currentPriceAmount().toPlainString() : "",
                        "فشل",
                        e.getMessage() != null ? e.getMessage() : ""
                });
            }
            results.add(row);
        }

        final int createdF = created;
        final int failedF = failed;
        notifySafely(() -> emailNotificationService.onBulkImportCompleted(
                createdF, 0, failedF, csv, sample, actorName(auth)));

        Map<String, Object> summary = new HashMap<>();
        summary.put("created", created);
        summary.put("failed", failed);
        summary.put("total", requests.size());
        summary.put("items", results);
        return summary;
    }

    @Transactional
    protected ProductResponse createSilently(ProductRequest req, Authentication auth) {
        if (productRepo.existsBySku(req.sku())) {
            throw new AppException(ErrorCode.CONFLICT, "SKU موجود مسبقاً: " + req.sku(), HttpStatus.CONFLICT);
        }
        var unit = unitRepo.findById(req.baseUnitId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND,
                        "الوحدة غير موجودة (" + req.baseUnitId() + ")", HttpStatus.NOT_FOUND));

        var builder = Product.builder()
                .sku(req.sku())
                .name(req.name())
                .baseUnit(unit)
                .barcode(req.barcode())
                .currentPriceAmount(req.currentPriceAmount())
                .description(req.description())
                .status(req.status() != null ? req.status() : "active");
        if (req.unitsPerPackage() != null) builder.unitsPerPackage(req.unitsPerPackage());
        if (req.minStockQty()     != null) builder.minStockQty(req.minStockQty());
        if (req.categoryId()      != null) {
            var cat = categoryRepo.findById(req.categoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND,
                            "التصنيف غير موجود (" + req.categoryId() + ")", HttpStatus.NOT_FOUND));
            builder.category(cat);
        }
        var saved = productRepo.save(builder.build());
        recordPriceHistory(saved, null, saved.getCurrentPriceAmount(),
                "سعر ابتدائي عند إنشاء الصنف (استيراد)", "product_bulk_import", saved.getId(), auth);
        return ProductResponse.from(saved);
    }

    private String safeStr(String s) { return s != null ? s : ""; }

    @Transactional
    public void delete(Long id) {
        var product = productRepo.findById(id)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Product not found", HttpStatus.NOT_FOUND));
        product.setDeletedAt(OffsetDateTime.now());
        productRepo.save(product);
    }

    private void recordPriceHistory(
            Product product,
            BigDecimal previousPrice,
            BigDecimal newPrice,
            String reason,
            String sourceType,
            Long sourceId,
            Authentication auth) {
        if (newPrice == null) return;

        Long userId = extractUserId(auth);
        priceHistoryRepo.save(ProductPriceHistory.builder()
                .product(product)
                .previousPriceAmount(previousPrice)
                .newPriceAmount(newPrice)
                .priceCurrency(product.getPriceCurrency() != null ? product.getPriceCurrency() : "DZD")
                .changedBy(userId != null ? userRepo.getReferenceById(userId) : null)
                .changeReason(reason)
                .sourceType(sourceType)
                .sourceId(sourceId)
                .build());
    }

    private boolean priceChanged(BigDecimal before, BigDecimal after) {
        if (before == null && after == null) return false;
        if (before == null || after == null) return true;
        return before.compareTo(after) != 0;
    }

    private Long extractUserId(Authentication auth) {
        if (auth instanceof UsernamePasswordAuthenticationToken t
                && t.getDetails() instanceof Claims claims) {
            return claims.get("userId", Long.class);
        }
        return null;
    }
}
