package com.allalarticle.backend.products;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.integration.ai.service.AiSettingsService;
import com.allalarticle.backend.integration.ai.service.OpenAiImageClient;
import com.allalarticle.backend.products.dto.ProductImageGenerationRequest;
import com.allalarticle.backend.products.dto.ProductImageGenerationResponse;
import com.allalarticle.backend.products.entity.Product;
import com.allalarticle.backend.storage.dto.MediaAssetResponse;
import com.allalarticle.backend.storage.service.R2StorageService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductImageGenerationService {

    private final ProductRepository productRepo;
    private final AiSettingsService aiSettingsService;
    private final OpenAiImageClient imageClient;
    private final R2StorageService storageService;
    private final ProductImageService productImageService;

    @Transactional
    public ProductImageGenerationResponse generate(Long productId, ProductImageGenerationRequest request, Authentication auth) {
        Product product = productRepo.findById(productId)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Product not found", HttpStatus.NOT_FOUND));

        String model = aiSettingsService.currentImageModel();
        String prompt = buildPrompt(product, request);
        var generated = imageClient.generate(aiSettingsService.resolveOpenAiApiKey(), model, prompt);

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("source", "openai");
        metadata.put("model", model);
        metadata.put("prompt", prompt);
        metadata.put("revisedPrompt", generated.revisedPrompt());
        metadata.put("generatedAt", Instant.now().toString());

        String filename = safeFilename(value(request.name(), product.getName())) + "-ai.png";
        var media = storageService.saveBytes(
                generated.bytes(),
                filename,
                generated.mimeType(),
                "product",
                product.getId(),
                extractUserId(auth),
                "AI - " + product.getName(),
                metadata);

        productImageService.linkProductImage(product.getId(), media.getId(), "ai_generated", null, metadata, false);

        return new ProductImageGenerationResponse(
                MediaAssetResponse.from(media),
                model,
                prompt,
                generated.revisedPrompt());
    }

    private String buildPrompt(Product product, ProductImageGenerationRequest request) {
        String name = value(request.name(), product.getName());
        String sku = value(request.sku(), product.getSku());
        String description = value(request.description(), product.getDescription());
        String category = value(request.category(), product.getCategory() != null ? product.getCategory().getName() : "");
        String baseUnit = value(request.baseUnit(), product.getBaseUnit() != null ? product.getBaseUnit().getName() : "");
        String packageUnit = value(request.packageUnit(), "");
        String extra = value(request.extraPrompt(), "");
        String visualDirection = visualDirection(name, description, category);

        return """
                Create a realistic, commercially useful product catalog image for an inventory management system.
                Product name: %s
                SKU/reference: %s
                Category: %s
                Description: %s
                Base unit: %s
                Packaging: %s

                Product-specific visual direction:
                %s

                Visual requirements:
                - Infer the real physical form from the product name, category, unit, and description.
                - Show the actual product type, not a generic cube, abstract box, random carton, or placeholder package.
                - Use a clean product-photo style on a white or very light studio background with natural contact shadow.
                - Make the product fill the frame in a useful catalog composition; crop nothing important.
                - If the product is normally sold in packaging, show the correct packaging shape and material.
                - If the product is a raw material or construction item, show the recognizable material form.
                - Keep labels minimal and plausible; do not invent brand logos, prices, watermarks, people, hands, or messy backgrounds.
                - Produce a fresh alternative image with a different angle or arrangement from previous generations.
                %s
                """.formatted(
                safePrompt(name),
                safePrompt(sku),
                safePrompt(category),
                safePrompt(description),
                safePrompt(baseUnit),
                safePrompt(packageUnit),
                visualDirection,
                extra.isBlank() ? "" : "Extra direction: " + safePrompt(extra));
    }

    private String visualDirection(String name, String description, String category) {
        String text = normalizeForMatching(name + " " + description + " " + category);
        if (containsAny(text, "اسمنت", "إسمنت", "سمنت", "cement", "ciment")) {
            return "- Render a heavy 25-50 kg cement bag/sack, made of kraft paper or woven plastic, standing or slightly angled. The bag should clearly read as cement, with folded seams and realistic material texture.";
        }
        if (containsAny(text, "آجر", "اجر", "قرمود", "طوب", "brick", "brique")) {
            return "- Render red clay bricks or hollow construction blocks in a neat stack, with visible holes/texture and realistic ceramic edges.";
        }
        if (containsAny(text, "حديد", "fer", "rebar", "steel", "armature")) {
            return "- Render a bundle of ribbed steel rebar rods, tied together, with metallic texture and visible ridges.";
        }
        if (containsAny(text, "رمل", "sable", "sand")) {
            return "- Render a clean small pile or clear bag of construction sand, with fine granular texture.";
        }
        if (containsAny(text, "حصى", "gravier", "gravel", "زلط")) {
            return "- Render a clear pile or bag of gravel stones with varied sizes and natural rough texture.";
        }
        if (containsAny(text, "دهان", "طلاء", "paint", "peinture")) {
            return "- Render a paint bucket/can with a clean lid and realistic plastic or metal surface.";
        }
        if (containsAny(text, "بلاط", "carrelage", "tile", "سيراميك")) {
            return "- Render a neat stack of ceramic tiles, showing the tile surface pattern and thin edges.";
        }
        if (containsAny(text, "انبوب", "أنبوب", "ماسورة", "pipe", "tube", "pvc")) {
            return "- Render pipes/tubes in a clean bundle or one prominent pipe segment, with circular openings visible.";
        }
        if (containsAny(text, "كابل", "cable", "سلك", "wire")) {
            return "- Render a coiled electrical cable or wire roll, cleanly organized and clearly recognizable.";
        }
        if (containsAny(text, "خشب", "wood", "bois", "لوح")) {
            return "- Render wooden planks or boards in a neat stack, with visible grain and realistic edges.";
        }
        if (containsAny(text, "برغي", "مسمار", "vis", "screw", "nail")) {
            return "- Render a small organized group of screws/nails with metallic reflections, not a box unless packaging is explicitly requested.";
        }
        if (containsAny(text, "كيس", "sack", "bag")) {
            return "- Render the item as a realistic standing bag/sack with correct material and product contents implied by the label shape.";
        }
        if (containsAny(text, "علبة", "box", "carton")) {
            return "- Render a realistic retail carton/box only because the product data indicates boxed packaging.";
        }
        return "- Render the most likely real-world physical product form based on the name and description. Prefer recognizable material, packaging, shape, and texture over a generic package.";
    }

    private Long extractUserId(Authentication auth) {
        if (auth instanceof UsernamePasswordAuthenticationToken t
                && t.getDetails() instanceof Claims claims) {
            return claims.get("userId", Long.class);
        }
        return null;
    }

    private String value(String preferred, String fallback) {
        return preferred != null && !preferred.isBlank() ? preferred.trim() : (fallback != null ? fallback.trim() : "");
    }

    private String safePrompt(String value) {
        if (value == null || value.isBlank()) return "not specified";
        return value.replaceAll("[\\r\\n]+", " ").trim();
    }

    private String normalizeForMatching(String value) {
        return value == null ? "" : value.toLowerCase()
                .replace('أ', 'ا')
                .replace('إ', 'ا')
                .replace('آ', 'ا')
                .replace('ة', 'ه');
    }

    private boolean containsAny(String value, String... terms) {
        for (String term : terms) {
            if (value.contains(normalizeForMatching(term))) return true;
        }
        return false;
    }

    private String safeFilename(String value) {
        String clean = value == null ? "product" : value.trim().toLowerCase()
                .replaceAll("[^a-z0-9\\u0600-\\u06FF]+", "-")
                .replaceAll("(^-+|-+$)", "");
        return clean.isBlank() ? "product" : clean;
    }
}
