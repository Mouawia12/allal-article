package com.allalarticle.backend.purchases.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record PurchaseItemRequest(
        @NotNull Long productId,
        @NotNull @Positive BigDecimal qty,
        BigDecimal unitPrice,
        String notes
) {}
