package com.allalarticle.backend.manufacturing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record QualityCheckRequest(
        @NotBlank String result,
        @NotNull @Positive BigDecimal checkedQty,
        @NotNull BigDecimal passedQty,
        BigDecimal reworkQty,
        BigDecimal rejectedQty,
        String notes
) {}
