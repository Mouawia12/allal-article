package com.allalarticle.backend.inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

/** One counted line. A recount is sent the same way once the count has moved to review. */
public record StockCountEntryRequest(
        @NotNull Long itemId,
        @PositiveOrZero BigDecimal countedQty,
        String reason,
        String notes
) {}
