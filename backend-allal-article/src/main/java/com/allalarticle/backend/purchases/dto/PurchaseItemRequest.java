package com.allalarticle.backend.purchases.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record PurchaseItemRequest(
        @NotNull Long productId,
        @NotNull @Positive BigDecimal qty,
        @PositiveOrZero
        BigDecimal unitPrice,
        String notes
) {}
