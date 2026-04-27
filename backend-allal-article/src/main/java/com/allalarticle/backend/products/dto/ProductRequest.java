package com.allalarticle.backend.products.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank @Size(max = 100) String sku,
        @NotBlank @Size(max = 200) String name,
        Long categoryId,
        @NotNull Long baseUnitId,
        @Size(max = 100) String barcode,
        BigDecimal unitsPerPackage,
        BigDecimal currentPriceAmount,
        BigDecimal minStockQty,
        String description,
        String status
) {}
