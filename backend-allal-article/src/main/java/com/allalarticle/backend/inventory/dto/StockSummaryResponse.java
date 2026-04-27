package com.allalarticle.backend.inventory.dto;

import com.allalarticle.backend.inventory.entity.ProductStock;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record StockSummaryResponse(
        Long id,
        Long productId,
        String productName,
        String productSku,
        Long warehouseId,
        String warehouseName,
        BigDecimal onHandQty,
        BigDecimal reservedQty,
        BigDecimal availableQty,
        OffsetDateTime updatedAt
) {
    public static StockSummaryResponse from(ProductStock s) {
        var p = s.getProduct();
        var w = s.getWarehouse();
        return new StockSummaryResponse(
                s.getId(),
                p.getId(), p.getName(), p.getSku(),
                w.getId(), w.getName(),
                s.getOnHandQty(), s.getReservedQty(), s.getAvailableQty(),
                s.getUpdatedAt()
        );
    }
}
