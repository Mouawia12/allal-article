package com.allalarticle.backend.documents.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

public record RoadInvoiceRequest(
        @NotNull LocalDate invoiceDate,
        Long wilayaId,
        Long customerId,
        Long driverId,
        String notes,
        Set<Long> orderIds,
        @NotEmpty @Valid List<ItemRequest> items
) {
    public record ItemRequest(
            @NotNull Long productId,
            @NotNull BigDecimal quantity,
            BigDecimal unitPrice,
            BigDecimal lineWeight,
            String notes
    ) {}
}
