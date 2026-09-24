package com.allalarticle.backend.inventory.dto;

import com.allalarticle.backend.inventory.entity.StockCountItem;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record StockCountItemResponse(
        Long id,
        Long productId,
        String productSku,
        String productName,
        String baseUnitName,
        BigDecimal systemQty,
        BigDecimal countedQty,
        BigDecimal recountQty,
        BigDecimal finalQty,
        BigDecimal difference,
        BigDecimal unitCost,
        BigDecimal differenceValue,
        boolean counted,
        String reason,
        String notes,
        OffsetDateTime countedAt
) {
    /**
     * @param blind while a count is still being taken, the system quantity is withheld so the
     *              person entering numbers cannot anchor on it
     */
    public static StockCountItemResponse from(StockCountItem item, boolean blind) {
        var product = item.getProduct();
        var unit = product.getBaseUnit();
        return new StockCountItemResponse(
                item.getId(),
                product.getId(), product.getSku(), product.getName(),
                unit != null ? unit.getName() : null,
                blind ? null : item.getSystemQty(),
                item.getCountedQty(),
                item.getRecountQty(),
                item.finalQty(),
                blind ? null : item.difference(),
                item.getUnitCost(),
                blind ? null : item.differenceValue(),
                item.isCounted(),
                item.getReason(),
                item.getNotes(),
                item.getCountedAt()
        );
    }
}
