package com.allalarticle.backend.purchases.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record CreatePurchaseReturnRequest(
        @NotNull LocalDate returnDate,
        Long warehouseId,
        String receivedBySupplier,
        String reason,
        @Valid @NotEmpty List<PurchaseReturnItemRequest> items
) {}
