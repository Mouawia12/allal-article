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
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.List;
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

    @Transactional
    public MediaAsset upload(MultipartFile file, String ownerType, Long ownerId, Long userId) {
        String originalFilename = file.getOriginalFilename();
        String extension = extractExtension(originalFilename);
        String objectKey = buildKey(ownerType, ownerId, extension);

        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucketName)
                            .key(objectKey)
                            .contentType(file.getContentType())
                            .contentLength(file.getSize())
                            .build(),
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize())
            );
        } catch (IOException e) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, "فشل رفع الملف: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }

        String publicUrl = publicUrlPrefix.isBlank() ? null : publicUrlPrefix + "/" + objectKey;

        MediaAsset asset = MediaAsset.builder()
                .ownerType(ownerType)
                .ownerId(ownerId)
                .bucketName(bucketName)
                .objectKey(objectKey)
                .publicUrl(publicUrl)
                .originalFilename(originalFilename)
                .mimeType(file.getContentType())
                .sizeBytes(file.getSize())
                .extension(extension)
                .createdById(userId)
                .build();

        return assetRepo.save(asset);
    }

    @Transactional
    public void delete(Long assetId) {
        MediaAsset asset = assetRepo.findById(assetId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "الملف غير موجود", HttpStatus.NOT_FOUND));

        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(asset.getBucketName())
                    .key(asset.getObjectKey())
                    .build());
        } catch (Exception e) {
            log.warn("Failed to delete R2 object {}: {}", asset.getObjectKey(), e.getMessage());
        }

        asset.setDeletedAt(OffsetDateTime.now());
        assetRepo.save(asset);
    }

    @Transactional(readOnly = true)
    public List<MediaAsset> findByOwner(String ownerType, Long ownerId) {
        return assetRepo.findByOwnerTypeAndOwnerIdAndDeletedAtIsNull(ownerType, ownerId);
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
}
