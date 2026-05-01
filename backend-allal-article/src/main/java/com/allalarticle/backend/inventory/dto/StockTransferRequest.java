package com.allalarticle.backend.inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record StockTransferRequest(
        @NotNull Long productId,
        @NotNull Long fromWarehouseId,
        @NotNull Long toWarehouseId,
        @NotNull @Positive BigDecimal qty,
        String notes
) {}
