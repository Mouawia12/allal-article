package com.allalarticle.backend.storage.service;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.storage.entity.MediaAsset;
import com.allalarticle.backend.storage.repository.MediaAssetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class R2StorageService {

    private final S3Client s3Client;
    private final MediaAssetRepository assetRepo;

    @Value("${r2.bucket-name}")
    private String bucketName;

    @Value("${r2.public-url-prefix:}")
    private String publicUrlPrefix;

    @Value("${r2.account-id:}")
    private String accountId;

    @Value("${r2.access-key-id:}")
    private String accessKeyId;

    @Value("${r2.secret-access-key:}")
    private String secretAccessKey;

    @Value("${media.local-dir:runtime-media}")
    private String localDir;

    @Transactional
    public MediaAsset upload(MultipartFile file, String ownerType, Long ownerId, Long userId) {
        try {
            return saveBytes(
                    file.getBytes(),
                    file.getOriginalFilename(),
                    file.getContentType(),
                    ownerType,
                    ownerId,
                    userId,
                    file.getOriginalFilename(),
                    null);
        } catch (IOException e) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, "فشل رفع الملف: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional
    public MediaAsset saveBytes(byte[] bytes, String originalFilename, String contentType,
                                String ownerType, Long ownerId, Long userId,
                                String title, Map<String, Object> metadata) {
        String extension = extractExtension(originalFilename);
        if (extension.isBlank()) extension = extensionFromContentType(contentType);
        String objectKey = buildKey(ownerType, ownerId, extension);
        String provider = "cloudflare_r2";
        String publicUrl = null;

        if (isR2Configured()) {
            try {
                s3Client.putObject(
                        PutObjectRequest.builder()
                                .bucket(bucketName)
                                .key(objectKey)
                                .contentType(contentType)
                                .contentLength((long) bytes.length)
                                .build(),
                        RequestBody.fromBytes(bytes)
                );
                publicUrl = publicUrlPrefix.isBlank() ? null : publicUrlPrefix + "/" + objectKey;
            } catch (Exception e) {
                log.warn("R2 upload failed, falling back to local media storage: {}", e.getMessage());
                provider = "local";
                writeLocal(objectKey, bytes);
            }
        } else {
            provider = "local";
            writeLocal(objectKey, bytes);
        }

        MediaAsset asset = MediaAsset.builder()
                .ownerType(ownerType)
                .ownerId(ownerId)
                .storageProvider(provider)
                .bucketName(bucketName)
                .objectKey(objectKey)
                .publicUrl(publicUrl)
                .originalFilename(originalFilename)
                .mimeType(contentType)
                .sizeBytes((long) bytes.length)
                .extension(extension)
                .title(title)
                .checksumSha256(sha256(bytes))
                .metadataJson(metadata)
                .createdById(userId)
                .build();

        MediaAsset saved = assetRepo.save(asset);
        if (saved.getPublicUrl() == null || saved.getPublicUrl().isBlank()) {
            saved.setPublicUrl("/api/media/" + saved.getId() + "/content");
            saved = assetRepo.save(saved);
        }
        return saved;
    }

    @Transactional
    public void delete(Long assetId) {
        MediaAsset asset = assetRepo.findById(assetId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "الملف غير موجود", HttpStatus.NOT_FOUND));

        if ("local".equals(asset.getStorageProvider())) {
            try {
                Files.deleteIfExists(localPath(asset.getObjectKey()));
            } catch (Exception e) {
                log.warn("Failed to delete local media {}: {}", asset.getObjectKey(), e.getMessage());
            }
        } else {
            try {
                s3Client.deleteObject(DeleteObjectRequest.builder()
                        .bucket(asset.getBucketName())
                        .key(asset.getObjectKey())
                        .build());
            } catch (Exception e) {
                log.warn("Failed to delete R2 object {}: {}", asset.getObjectKey(), e.getMessage());
            }
        }

        asset.setDeletedAt(OffsetDateTime.now());
        assetRepo.save(asset);
    }

    @Transactional(readOnly = true)
    public List<MediaAsset> findByOwner(String ownerType, Long ownerId) {
        return assetRepo.findByOwnerTypeAndOwnerIdAndDeletedAtIsNull(ownerType, ownerId);
    }

    @Transactional(readOnly = true)
    public MediaContent loadContent(Long assetId) {
        MediaAsset asset = assetRepo.findById(assetId)
                .filter(a -> a.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "الملف غير موجود", HttpStatus.NOT_FOUND));

        try {
            byte[] bytes;
            if ("local".equals(asset.getStorageProvider())) {
                bytes = Files.readAllBytes(localPath(asset.getObjectKey()));
            } else {
                ResponseBytes<GetObjectResponse> response = s3Client.getObjectAsBytes(GetObjectRequest.builder()
                        .bucket(asset.getBucketName())
                        .key(asset.getObjectKey())
                        .build());
                bytes = response.asByteArray();
            }
            return new MediaContent(bytes, asset.getMimeType(), asset.getOriginalFilename());
        } catch (Exception e) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, "تعذر تحميل الملف", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String buildKey(String ownerType, Long ownerId, String extension) {
        return (ownerType != null ? ownerType : "general") + "/"
                + (ownerId != null ? ownerId + "/" : "")
                + UUID.randomUUID() + (extension.isBlank() ? "" : "." + extension);
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }

    private String extensionFromContentType(String contentType) {
        if ("image/png".equalsIgnoreCase(contentType)) return "png";
        if ("image/jpeg".equalsIgnoreCase(contentType)) return "jpg";
        if ("image/webp".equalsIgnoreCase(contentType)) return "webp";
        return "";
    }

    private boolean isR2Configured() {
        return hasRealValue(accountId) && hasRealValue(accessKeyId) && hasRealValue(secretAccessKey);
    }

    private boolean hasRealValue(String value) {
        return value != null && !value.isBlank() && !"placeholder".equalsIgnoreCase(value.trim());
    }

    private void writeLocal(String objectKey, byte[] bytes) {
        try {
            Path target = localPath(objectKey);
            Files.createDirectories(target.getParent());
            Files.write(target, bytes);
        } catch (IOException e) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, "تعذر حفظ الملف محلياً", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private Path localPath(String objectKey) {
        Path configuredRoot = Path.of(localDir);
        Path root = configuredRoot.isAbsolute()
                ? configuredRoot.normalize()
                : Path.of(System.getProperty("user.home"), ".allal-article", localDir).normalize();
        Path target = root.resolve(objectKey).normalize();
        if (!target.startsWith(root)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "مسار ملف غير صالح", HttpStatus.BAD_REQUEST);
        }
        return target;
    }

    private String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (Exception e) {
            return null;
        }
    }

    public record MediaContent(byte[] bytes, String contentType, String filename) {}
}
