package com.allalarticle.backend.orders.dto;

import com.allalarticle.backend.orders.entity.Order;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
        Long id,
        UUID publicId,
        String orderNumber,
        String orderStatus,
        String shippingStatus,
        String paymentStatus,
        Long customerId,
        String customerName,
        Long salesUserId,
        String salesUserName,
        String priceCurrency,
        BigDecimal totalAmount,
        String notes,
        String internalNotes,
        List<OrderItemResponse> items,
        OffsetDateTime submittedAt,
        OffsetDateTime confirmedAt,
        OffsetDateTime shippedAt,
        OffsetDateTime completedAt,
        OffsetDateTime cancelledAt,
        OffsetDateTime createdAt
) {
    public static OrderResponse from(Order o) {
        var cust  = o.getCustomer();
        var sales = o.getSalesUser();
        return new OrderResponse(
                o.getId(), o.getPublicId(), o.getOrderNumber(),
                o.getOrderStatus(), o.getShippingStatus(), o.getPaymentStatus(),
                cust  != null ? cust.getId()   : null,
                cust  != null ? cust.getName() : null,
                sales != null ? sales.getId()   : null,
                sales != null ? sales.getName() : null,
                o.getPriceCurrency(), o.getTotalAmount(), o.getNotes(), o.getInternalNotes(),
                o.getItems().stream().filter(i -> i.getDeletedAt() == null)
                             .map(OrderItemResponse::from).toList(),
                o.getSubmittedAt(), o.getConfirmedAt(), o.getShippedAt(),
                o.getCompletedAt(), o.getCancelledAt(), o.getCreatedAt()
        );
    }
}
