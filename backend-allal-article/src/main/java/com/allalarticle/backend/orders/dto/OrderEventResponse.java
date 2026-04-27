package com.allalarticle.backend.orders.dto;

import com.allalarticle.backend.orders.entity.OrderEvent;

import java.time.OffsetDateTime;
import java.util.Map;

public record OrderEventResponse(
        Long id,
        String eventType,
        Map<String, Object> payloadJson,
        Long performedById,
        OffsetDateTime createdAt
) {
    public static OrderEventResponse from(OrderEvent e) {
        return new OrderEventResponse(e.getId(), e.getEventType(),
                e.getPayloadJson(), e.getPerformedById(), e.getCreatedAt());
    }
}
