package com.allalarticle.backend.manufacturing.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ManufacturingRequestRequest(
        @NotBlank String sourceType,
        Long sourceOrderId,
        Long sourceOrderItemId,
        @NotNull Long productId,
        @NotNull @Positive BigDecimal requestedQty,
        String unitName,
        String priority,
        String factoryName,
        String productionLine,
        Long responsibleUserId,
        Long qualityUserId,
        Long destinationWarehouseId,
        String destinationLabel,
        Long linkedCustomerId,
        String customerSnapshot,
        boolean depositRequired,
        BigDecimal depositAmount,
        LocalDate dueDate,
        String notes,
        @Valid List<MaterialLine> materials
) {
    public record MaterialLine(
            @NotNull Long materialProductId,
            @NotNull @Positive BigDecimal plannedQty,
            Long warehouseId,
            String notes
    ) {}
}
