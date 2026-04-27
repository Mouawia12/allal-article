package com.allalarticle.backend.products.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProductUnitRequest(
        @NotBlank @Size(max = 80) String name,
        @Size(max = 20) String symbol
) {}
