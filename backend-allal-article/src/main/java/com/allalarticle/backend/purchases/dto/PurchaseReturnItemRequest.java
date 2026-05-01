package com.allalarticle.backend.purchases.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record PurchaseReturnItemRequest(
        @NotNull Long purchaseOrderItemId,
        @NotNull @DecimalMin(value = "0.001") BigDecimal qty,
        String notes
) {}
