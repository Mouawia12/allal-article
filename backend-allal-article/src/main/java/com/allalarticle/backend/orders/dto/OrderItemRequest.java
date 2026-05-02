package com.allalarticle.backend.orders.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record OrderItemRequest(
        @NotNull Long productId,
        @NotNull @Positive BigDecimal qty,
        @PositiveOrZero
        BigDecimal unitPrice,
        String customerNote
) {}
