package com.allalarticle.backend.storage.dto;

import com.allalarticle.backend.storage.entity.MediaAsset;

import java.time.OffsetDateTime;
import java.util.UUID;

public record MediaAssetResponse(
        Long id,
        UUID publicId,
        String ownerType,
        Long ownerId,
        String storageProvider,
        String publicUrl,
        String originalFilename,
        String mimeType,
        Long sizeBytes,
        String extension,
        String title,
        OffsetDateTime createdAt
) {
    public static MediaAssetResponse from(MediaAsset a) {
        return new MediaAssetResponse(a.getId(), a.getPublicId(), a.getOwnerType(), a.getOwnerId(),
                a.getStorageProvider(), a.getPublicUrl(), a.getOriginalFilename(), a.getMimeType(),
                a.getSizeBytes(), a.getExtension(), a.getTitle(), a.getCreatedAt());
    }
}
