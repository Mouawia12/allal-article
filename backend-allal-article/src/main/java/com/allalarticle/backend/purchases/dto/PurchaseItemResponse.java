package com.allalarticle.backend.purchases.dto;

import com.allalarticle.backend.purchases.entity.PurchaseOrderItem;

import java.math.BigDecimal;

public record PurchaseItemResponse(
        Long id, Long productId, String productName, String productSku,
        BigDecimal orderedQty, BigDecimal receivedQty, BigDecimal returnedQty,
        Long priceListId, Long priceListItemId, String priceListName,
        BigDecimal unitPrice, BigDecimal lineSubtotal, String pricingSource, String notes
) {
    public static PurchaseItemResponse from(PurchaseOrderItem i) {
        var p = i.getProduct();
        return new PurchaseItemResponse(i.getId(), p.getId(), p.getName(), p.getSku(),
                i.getOrderedQty(), i.getReceivedQty(), i.getReturnedQty(),
                i.getPriceListId(), i.getPriceListItemId(), i.getPriceListNameSnapshot(),
                i.getUnitPrice(), i.getLineSubtotal(), i.getPricingSource(), i.getNotes());
    }
}
