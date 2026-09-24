package com.allalarticle.backend.inventory.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

/**
 * Opens a count. Leaving productIds empty counts everything the warehouse holds; passing a subset
 * counts only those products, which is how a partial or spot count is run.
 */
public record StockCountRequest(
        @NotNull Long warehouseId,
        Boolean blind,
        LocalDate scheduledFor,
        String notes,
        List<Long> productIds
) {}
