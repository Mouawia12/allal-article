package com.allalarticle.backend.inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record StockAdjustmentRequest(
        @NotNull Long productId,
        @NotNull Long warehouseId,
        @NotNull @Positive BigDecimal qty,
        @NotNull String type,   // IN or OUT
        String notes
) {}
