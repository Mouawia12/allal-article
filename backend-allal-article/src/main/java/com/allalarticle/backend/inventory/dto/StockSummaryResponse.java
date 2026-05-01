package com.allalarticle.backend.inventory.dto;

import com.allalarticle.backend.inventory.entity.ProductStock;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record StockSummaryResponse(
        Long id,
        Long productId,
        String productName,
        String productSku,
        String categoryName,
        String baseUnitName,
        String baseUnitSymbol,
        Long warehouseId,
        String warehouseName,
        BigDecimal onHandQty,
        BigDecimal reservedQty,
        BigDecimal pendingQty,
        BigDecimal availableQty,
        BigDecimal projectedQty,
        BigDecimal minStockQty,
        OffsetDateTime updatedAt
) {
    public static StockSummaryResponse from(ProductStock s) {
        var p = s.getProduct();
        var w = s.getWarehouse();
        var category = p.getCategory();
        var unit = p.getBaseUnit();
        var onHand = safe(s.getOnHandQty());
        var reserved = safe(s.getReservedQty());
        var pending = safe(s.getPendingQty());
        var available = onHand.subtract(reserved);
        var projected = available.add(pending);
        return new StockSummaryResponse(
                s.getId(),
                p.getId(), p.getName(), p.getSku(),
                category != null ? category.getName() : null,
                unit != null ? unit.getName() : null,
                unit != null ? unit.getSymbol() : null,
                w.getId(), w.getName(),
                onHand, reserved, pending, available, projected, safe(p.getMinStockQty()),
                s.getUpdatedAt()
        );
    }

    private static BigDecimal safe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
