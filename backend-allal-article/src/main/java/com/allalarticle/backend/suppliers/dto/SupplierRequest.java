package com.allalarticle.backend.suppliers.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record SupplierRequest(
        @NotBlank @Size(max = 200) String name,
        @Size(max = 200) String legalName,
        @Size(max = 50) String phone,
        @Size(max = 150) String email,
        @Size(max = 80) String taxNumber,
        @Size(max = 80) String commercialRegister,
        @Size(max = 80) String nisNumber,
        Long wilayaId,
        String address,
        @Size(max = 80) String category,
        @Size(max = 120) String paymentTerms,
        BigDecimal openingBalance,
        String notes
) {}
