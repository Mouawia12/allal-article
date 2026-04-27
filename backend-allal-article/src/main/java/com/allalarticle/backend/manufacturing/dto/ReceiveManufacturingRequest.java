package com.allalarticle.backend.manufacturing.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record ReceiveManufacturingRequest(
        @NotNull Long warehouseId,
        @NotNull @Positive BigDecimal receivedQty,
        BigDecimal acceptedQty,
        BigDecimal quarantineQty,
        String notes
) {}
