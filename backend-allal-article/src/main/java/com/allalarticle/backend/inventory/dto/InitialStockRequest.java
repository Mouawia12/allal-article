package com.allalarticle.backend.inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record InitialStockRequest(
        @NotNull Long productId,
        @NotNull Long warehouseId,
        @NotNull @PositiveOrZero BigDecimal qty
) {}
