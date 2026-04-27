package com.allalarticle.backend.returns.dto;

import com.allalarticle.backend.returns.entity.Return;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ReturnResponse(
        Long id, UUID publicId, String returnNumber,
        Long orderId, Long customerId, String customerName,
        LocalDate returnDate, String status, String notes,
        List<ReturnItemResponse> items, OffsetDateTime createdAt
) {
    public static ReturnResponse from(Return r) {
        var c = r.getCustomer();
        var o = r.getOrder();
        return new ReturnResponse(r.getId(), r.getPublicId(), r.getReturnNumber(),
                o != null ? o.getId() : null,
                c != null ? c.getId() : null, c != null ? c.getName() : null,
                r.getReturnDate(), r.getStatus(), r.getNotes(),
                r.getItems().stream().map(ReturnItemResponse::from).toList(),
                r.getCreatedAt());
    }
}
