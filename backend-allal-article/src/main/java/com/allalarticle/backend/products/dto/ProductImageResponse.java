package com.allalarticle.backend.products.dto;

import com.allalarticle.backend.storage.dto.MediaAssetResponse;

import java.time.OffsetDateTime;

public record ProductImageResponse(
        Long id,
        Long productId,
        MediaAssetResponse media,
        String sourceType,
        boolean isPrimary,
        Integer sortOrder,
        String processingStatus,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
