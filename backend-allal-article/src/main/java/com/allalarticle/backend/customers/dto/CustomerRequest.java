package com.allalarticle.backend.customers.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CustomerRequest(
        @NotBlank @Size(max = 200) String name,
        @Size(max = 30) String phone,
        @Size(max = 30) String phone2,
        @Size(max = 200) String email,
        Long wilayaId,
        String address,
        String shippingRoute,
        BigDecimal openingBalance,
        Long salespersonId,
        String notes
) {}
