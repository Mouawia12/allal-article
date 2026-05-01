package com.allalarticle.backend.products.dto;

import com.allalarticle.backend.products.entity.ProductPriceHistory;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record ProductPriceHistoryResponse(
        Long id,
        Long productId,
        BigDecimal previousPriceAmount,
        BigDecimal newPriceAmount,
        String priceCurrency,
        Long changedById,
        String changedByName,
        String changeReason,
        String sourceType,
        Long sourceId,
        OffsetDateTime effectiveAt,
        OffsetDateTime createdAt
) {
    public static ProductPriceHistoryResponse from(ProductPriceHistory h) {
        var user = h.getChangedBy();
        return new ProductPriceHistoryResponse(
                h.getId(),
                h.getProduct().getId(),
                h.getPreviousPriceAmount(),
                h.getNewPriceAmount(),
                h.getPriceCurrency(),
                user != null ? user.getId() : null,
                user != null ? user.getName() : null,
                h.getChangeReason(),
                h.getSourceType(),
                h.getSourceId(),
                h.getEffectiveAt(),
                h.getCreatedAt()
        );
    }
}
