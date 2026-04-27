package com.allalarticle.backend.returns.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record ReturnItemRequest(
        @NotNull Long productId,
        Long orderItemId,
        @NotNull @Positive BigDecimal qty,
        String conditionStatus,
        String notes
) {}
