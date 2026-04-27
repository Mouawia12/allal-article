package com.allalarticle.backend.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record WarehouseRequest(
        @NotBlank @Size(max = 50) String code,
        @NotBlank @Size(max = 150) String name,
        @Size(max = 40) String warehouseType,
        @Size(max = 120) String city,
        String address,
        Long managerId,
        BigDecimal capacityQty,
        boolean isDefault
) {}
