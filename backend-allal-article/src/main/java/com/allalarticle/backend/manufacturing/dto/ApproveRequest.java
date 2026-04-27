package com.allalarticle.backend.manufacturing.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record ApproveRequest(
        @NotNull @Positive BigDecimal approvedQty
) {}
