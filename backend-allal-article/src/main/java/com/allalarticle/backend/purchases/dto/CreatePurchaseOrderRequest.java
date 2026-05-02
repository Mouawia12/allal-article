package com.allalarticle.backend.purchases.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record CreatePurchaseOrderRequest(
        @NotNull Long supplierId,
        String priceListId,
        LocalDate expectedDate,
        String notes,
        @NotEmpty @Valid List<PurchaseItemRequest> items
) {}
