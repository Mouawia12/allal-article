package com.allalarticle.backend.orders.dto;

import com.allalarticle.backend.orders.entity.OrderItem;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemResponse(
        Long id,
        UUID publicId,
        int lineNumber,
        String lineStatus,
        Long productId,
        String productName,
        String productSku,
        BigDecimal requestedQty,
        BigDecimal approvedQty,
        BigDecimal shippedQty,
        BigDecimal cancelledQty,
        Long priceListId,
        Long priceListItemId,
        String priceListName,
        BigDecimal unitPrice,
        BigDecimal lineSubtotal,
        String pricingSource,
        String customerNote
) {
    public static OrderItemResponse from(OrderItem i) {
        var p = i.getProduct();
        return new OrderItemResponse(
                i.getId(), i.getPublicId(), i.getLineNumber(), i.getLineStatus(),
                p.getId(), p.getName(), p.getSku(),
                i.getRequestedQty(), i.getApprovedQty(), i.getShippedQty(),
                i.getCancelledQty(), i.getPriceListId(), i.getPriceListItemId(),
                i.getPriceListNameSnapshot(), i.getUnitPrice(), i.getLineSubtotal(),
                i.getPricingSource(), i.getCustomerNote()
        );
    }
}
