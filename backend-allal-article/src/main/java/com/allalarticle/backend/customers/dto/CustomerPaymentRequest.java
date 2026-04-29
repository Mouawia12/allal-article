package com.allalarticle.backend.customers.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CustomerPaymentRequest(
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        @NotBlank @Pattern(regexp = "in|out") String direction,
        @NotBlank @Pattern(regexp = "cash|bank|cheque") String paymentMethod,
        String referenceNumber,
        Long receivedById,
        String counterpartyName,
        LocalDate paymentDate,
        String notes
) {}
