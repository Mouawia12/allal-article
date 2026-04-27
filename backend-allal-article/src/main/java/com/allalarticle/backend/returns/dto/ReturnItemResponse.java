package com.allalarticle.backend.returns.dto;

import com.allalarticle.backend.returns.entity.ReturnItem;

import java.math.BigDecimal;

public record ReturnItemResponse(
        Long id, Long productId, String productName,
        Long orderItemId, BigDecimal returnedQty, BigDecimal acceptedQty,
        String conditionStatus, String notes
) {
    public static ReturnItemResponse from(ReturnItem i) {
        var p = i.getProduct();
        var oi = i.getOrderItem();
        return new ReturnItemResponse(i.getId(), p.getId(), p.getName(),
                oi != null ? oi.getId() : null,
                i.getReturnedQty(), i.getAcceptedQty(),
                i.getConditionStatus(), i.getNotes());
    }
}
