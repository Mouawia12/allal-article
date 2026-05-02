package com.allalarticle.backend.products;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.integration.ai.service.AiSettingsService;
import com.allalarticle.backend.integration.ai.service.OpenAiImageClient;
import com.allalarticle.backend.products.dto.ProductImageResponse;
import com.allalarticle.backend.products.entity.Product;
import com.allalarticle.backend.storage.dto.MediaAssetResponse;
import com.allalarticle.backend.storage.entity.MediaAsset;
import com.allalarticle.backend.storage.service.R2StorageService;
import com.allalarticle.backend.tenant.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductImageService {

    private final ProductRepository productRepo;
    private final JdbcTemplate jdbc;
    private final R2StorageService storageService;
    private final AiSettingsService aiSettingsService;
    private final OpenAiImageClient imageClient;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<ProductImageResponse> list(Long productId) {
        ensureProductExists(productId);
        String schema = schema();
        return jdbc.query(String.format("""
            SELECT pi.id AS product_image_id, pi.product_id, pi.source_type, pi.is_primary,
                   pi.sort_order, pi.processing_status, pi.created_at AS product_image_created_at,
                   pi.updated_at AS product_image_updated_at,
                   ma.id AS media_id, ma.public_id, ma.owner_type, ma.owner_id, ma.storage_provider,
                   ma.public_url, ma.original_filename, ma.mime_type, ma.size_bytes, ma.extension,
                   ma.title, ma.created_at AS media_created_at
            FROM "%s".product_images pi
            JOIN "%s".media_assets ma ON ma.id = pi.media_asset_id
            WHERE pi.product_id = ? AND ma.deleted_at IS NULL
            ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
            """, schema, schema), (rs, rowNum) -> mapRow(rs), productId);
    }

    @Transactional
    public ProductImageResponse upload(Long productId, MultipartFile file, Authentication auth) {
        Product product = loadProduct(productId);
        validateImageFile(file);
        String contentType = safeImageContentType(file.getContentType(), file.getOriginalFilename());

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("source", "manual_upload");
        metadata.put("uploadedAt", Instant.now().toString());

        try {
            MediaAsset media = storageService.saveBytes(
                    file.getBytes(),
                    file.getOriginalFilename(),
                    contentType,
                    "product",
                    product.getId(),
                    extractUserId(auth),
                    file.getOriginalFilename(),
                    metadata);
            return linkProductImage(product.getId(), media.getId(), "manual", null, metadata, false);
        } catch (IOException e) {
            throw new AppException(ErrorCode.INTERNAL_ERROR,
                    "فشل رفع صورة الصنف", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional
    public ProductImageResponse process(Long productId, Long productImageId, Authentication auth) {
        Product product = loadProduct(productId);
        if (!aiSettingsService.currentImageProcessEnabled()) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "معالجة الصور بالذكاء الاصطناعي غير مفعّلة في الإعدادات", HttpStatus.BAD_REQUEST);
        }

        String schema = schema();
        ImageLink source = findImageLink(schema, productId, productImageId);
        if (source == null) {
            throw new AppException(ErrorCode.NOT_FOUND, "صورة الصنف غير موجودة", HttpStatus.NOT_FOUND);
        }

        var content = storageService.loadContent(source.mediaAssetId());
        validateOpenAiImageType(content.contentType(), content.filename());

        String selectedModel = aiSettingsService.currentImageModel();
        String editModel = imageClient.imageEditModel(selectedModel);
        String prompt = aiSettingsService.currentImageProcessingPrompt();
        var processed = imageClient.edit(
                aiSettingsService.resolveOpenAiApiKey(),
                editModel,
                prompt,
                content.bytes(),
                content.filename(),
                content.contentType());

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("source", "openai");
        metadata.put("operation", "background_removal");
        metadata.put("requestedImageModel", selectedModel);
        metadata.put("model", editModel);
        metadata.put("prompt", prompt);
        metadata.put("originalProductImageId", productImageId);
        metadata.put("originalMediaAssetId", source.mediaAssetId());
        metadata.put("processedAt", Instant.now().toString());

        String filename = safeFilename(product.getName()) + "-isolated.png";
        MediaAsset media = storageService.saveBytes(
                processed.bytes(),
                filename,
                processed.mimeType(),
                "product",
                product.getId(),
                extractUserId(auth),
                "AI processed - " + product.getName(),
                metadata);

        return linkProductImage(product.getId(), media.getId(), "ai_processed", productImageId, metadata, true);
    }

    @Transactional
    public ProductImageResponse linkProductImage(Long productId, Long mediaAssetId, String sourceType,
                                                 Long originalImageId, Map<String, Object> metadata,
                                                 boolean forcePrimary) {
        String schema = schema();
        Integer count = jdbc.queryForObject(
                String.format("""
                    SELECT COUNT(*)
                    FROM "%s".product_images pi
                    JOIN "%s".media_assets ma ON ma.id = pi.media_asset_id
                    WHERE pi.product_id = ? AND ma.deleted_at IS NULL
                    """, schema, schema),
                Integer.class,
                productId);
        int sortOrder = count != null ? count : 0;
        boolean primary = forcePrimary || sortOrder == 0;
        if (primary) {
            jdbc.update(String.format("""
                UPDATE "%s".product_images
                SET is_primary = false, updated_at = now()
                WHERE product_id = ?
                """, schema), productId);
        }

        Long productImageId = jdbc.queryForObject(String.format("""
            INSERT INTO "%s".product_images
                (product_id, media_asset_id, source_type, original_image_id, is_primary, sort_order,
                 processing_status, metadata_json)
            VALUES (?, ?, ?, ?, ?, ?, 'completed', ?::jsonb)
            RETURNING id
            """, schema), Long.class, productId, mediaAssetId, sourceType, originalImageId, primary, sortOrder,
                toJson(metadata));

        return findById(schema, productImageId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "صورة الصنف غير موجودة", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public ProductImageResponse setPrimary(Long productId, Long productImageId) {
        ensureProductExists(productId);
        String schema = schema();
        Long mediaId = findMediaId(schema, productId, productImageId);
        if (mediaId == null) {
            throw new AppException(ErrorCode.NOT_FOUND, "صورة الصنف غير موجودة", HttpStatus.NOT_FOUND);
        }
        jdbc.update(String.format("UPDATE \"%s\".product_images SET is_primary = false, updated_at = now() WHERE product_id = ?", schema),
                productId);
        jdbc.update(String.format("UPDATE \"%s\".product_images SET is_primary = true, updated_at = now() WHERE id = ? AND product_id = ?", schema),
                productImageId, productId);
        return findById(schema, productImageId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "صورة الصنف غير موجودة", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public void delete(Long productId, Long productImageId) {
        ensureProductExists(productId);
        String schema = schema();
        var row = jdbc.query(String.format("""
            SELECT media_asset_id, is_primary
            FROM "%s".product_images
            WHERE id = ? AND product_id = ?
            """, schema), rs -> rs.next()
                ? new ImageLink(rs.getLong("media_asset_id"), rs.getBoolean("is_primary"), null, null, null)
                : null, productImageId, productId);
        if (row == null) {
            throw new AppException(ErrorCode.NOT_FOUND, "صورة الصنف غير موجودة", HttpStatus.NOT_FOUND);
        }

        jdbc.update(String.format("DELETE FROM \"%s\".product_images WHERE id = ? AND product_id = ?", schema),
                productImageId, productId);
        storageService.delete(row.mediaAssetId());

        if (row.primary()) {
            promoteFirstImage(schema, productId);
        }
    }

    private ImageLink findImageLink(String schema, Long productId, Long productImageId) {
        return jdbc.query(String.format("""
            SELECT pi.media_asset_id, pi.is_primary, ma.original_filename, ma.mime_type, ma.title
            FROM "%s".product_images pi
            JOIN "%s".media_assets ma ON ma.id = pi.media_asset_id
            WHERE pi.id = ? AND pi.product_id = ? AND ma.deleted_at IS NULL
            """, schema, schema), rs -> rs.next()
                ? new ImageLink(
                    rs.getLong("media_asset_id"),
                    rs.getBoolean("is_primary"),
                    rs.getString("original_filename"),
                    rs.getString("mime_type"),
                    rs.getString("title"))
                : null, productImageId, productId);
    }

    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "اختر صورة صالحة للرفع", HttpStatus.BAD_REQUEST);
        }
        validateOpenAiImageType(file.getContentType(), file.getOriginalFilename());
    }

    private void validateOpenAiImageType(String contentType, String filename) {
        String type = contentType != null ? contentType.trim().toLowerCase() : "";
        String name = filename != null ? filename.trim().toLowerCase() : "";
        boolean supported = type.equals("image/png")
                || type.equals("image/jpeg")
                || type.equals("image/jpg")
                || type.equals("image/webp")
                || name.endsWith(".png")
                || name.endsWith(".jpg")
                || name.endsWith(".jpeg")
                || name.endsWith(".webp");
        if (!supported) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "معالجة الصور تدعم ملفات PNG أو JPG أو WEBP فقط", HttpStatus.BAD_REQUEST);
        }
    }

    private String safeImageContentType(String contentType, String filename) {
        String type = contentType != null ? contentType.trim().toLowerCase() : "";
        if (type.equals("image/png") || type.equals("image/jpeg") || type.equals("image/webp")) return type;
        String name = filename != null ? filename.trim().toLowerCase() : "";
        if (name.endsWith(".png")) return "image/png";
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
        if (name.endsWith(".webp")) return "image/webp";
        return "application/octet-stream";
    }

    private void promoteFirstImage(String schema, Long productId) {
        jdbc.update(String.format("""
            UPDATE "%s".product_images
            SET is_primary = true, updated_at = now()
            WHERE id = (
                SELECT pi.id
                FROM "%s".product_images pi
                JOIN "%s".media_assets ma ON ma.id = pi.media_asset_id
                WHERE pi.product_id = ? AND ma.deleted_at IS NULL
                ORDER BY pi.sort_order ASC, pi.id ASC
                LIMIT 1
            )
            """, schema, schema, schema), productId);
    }

    private Long findMediaId(String schema, Long productId, Long productImageId) {
        List<Long> ids = jdbc.queryForList(String.format("""
            SELECT pi.media_asset_id
            FROM "%s".product_images pi
            JOIN "%s".media_assets ma ON ma.id = pi.media_asset_id
            WHERE pi.id = ? AND pi.product_id = ? AND ma.deleted_at IS NULL
            """, schema, schema), Long.class, productImageId, productId);
        return ids.isEmpty() ? null : ids.get(0);
    }

    private java.util.Optional<ProductImageResponse> findById(String schema, Long productImageId) {
        return jdbc.query(String.format("""
            SELECT pi.id AS product_image_id, pi.product_id, pi.source_type, pi.is_primary,
                   pi.sort_order, pi.processing_status, pi.created_at AS product_image_created_at,
                   pi.updated_at AS product_image_updated_at,
                   ma.id AS media_id, ma.public_id, ma.owner_type, ma.owner_id, ma.storage_provider,
                   ma.public_url, ma.original_filename, ma.mime_type, ma.size_bytes, ma.extension,
                   ma.title, ma.created_at AS media_created_at
            FROM "%s".product_images pi
            JOIN "%s".media_assets ma ON ma.id = pi.media_asset_id
            WHERE pi.id = ? AND ma.deleted_at IS NULL
            """, schema, schema), rs -> rs.next() ? java.util.Optional.of(mapRow(rs)) : java.util.Optional.empty(),
                productImageId);
    }

    private ProductImageResponse mapRow(ResultSet rs) throws SQLException {
        MediaAsset media = MediaAsset.builder()
                .id(rs.getLong("media_id"))
                .publicId(rs.getObject("public_id", UUID.class))
                .ownerType(rs.getString("owner_type"))
                .ownerId((Long) rs.getObject("owner_id"))
                .storageProvider(rs.getString("storage_provider"))
                .publicUrl(rs.getString("public_url"))
                .originalFilename(rs.getString("original_filename"))
                .mimeType(rs.getString("mime_type"))
                .sizeBytes((Long) rs.getObject("size_bytes"))
                .extension(rs.getString("extension"))
                .title(rs.getString("title"))
                .createdAt(rs.getObject("media_created_at", java.time.OffsetDateTime.class))
                .build();
        return new ProductImageResponse(
                rs.getLong("product_image_id"),
                rs.getLong("product_id"),
                MediaAssetResponse.from(media),
                rs.getString("source_type"),
                rs.getBoolean("is_primary"),
                (Integer) rs.getObject("sort_order"),
                rs.getString("processing_status"),
                rs.getObject("product_image_created_at", java.time.OffsetDateTime.class),
                rs.getObject("product_image_updated_at", java.time.OffsetDateTime.class));
    }

    private void ensureProductExists(Long productId) {
        loadProduct(productId);
    }

    private Product loadProduct(Long productId) {
        return productRepo.findById(productId)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Product not found", HttpStatus.NOT_FOUND));
    }

    private Long extractUserId(Authentication auth) {
        if (auth instanceof UsernamePasswordAuthenticationToken t
                && t.getDetails() instanceof Claims claims) {
            return claims.get("userId", Long.class);
        }
        return null;
    }

    private String toJson(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return "{}";
        }
    }

    private String safeFilename(String value) {
        String clean = value == null ? "product" : value.trim().toLowerCase()
                .replaceAll("[^a-z0-9\\u0600-\\u06FF]+", "-")
                .replaceAll("(^-+|-+$)", "");
        return clean.isBlank() ? "product" : clean;
    }

    private String schema() {
        String schema = TenantContext.get();
        if (!TenantContext.isValidSchema(schema)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Invalid tenant context", HttpStatus.BAD_REQUEST);
        }
        return schema;
    }

    private record ImageLink(Long mediaAssetId, boolean primary, String originalFilename, String mimeType, String title) {}
}
