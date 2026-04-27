package com.allalarticle.backend.inventory.dto;

import com.allalarticle.backend.inventory.entity.StockMovement;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record StockMovementResponse(
        Long id,
        UUID publicId,
        Long productId,
        String productName,
        Long warehouseId,
        String warehouseName,
        String movementType,
        BigDecimal qty,
        BigDecimal balanceBefore,
        BigDecimal balanceAfter,
        String sourceType,
        Long sourceId,
        String notes,
        Long performedById,
        String performedByName,
        OffsetDateTime createdAt
) {
    public static StockMovementResponse from(StockMovement m) {
        var p = m.getProduct();
        var w = m.getWarehouse();
        var u = m.getPerformedBy();
        return new StockMovementResponse(
                m.getId(), m.getPublicId(),
                p.getId(), p.getName(),
                w.getId(), w.getName(),
                m.getMovementType(), m.getQty(),
                m.getBalanceBefore(), m.getBalanceAfter(),
                m.getSourceType(), m.getSourceId(), m.getNotes(),
                u != null ? u.getId()   : null,
                u != null ? u.getName() : null,
                m.getCreatedAt()
        );
    }
}
