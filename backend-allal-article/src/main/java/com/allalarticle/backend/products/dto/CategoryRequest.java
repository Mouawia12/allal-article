package com.allalarticle.backend.products.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank @Size(max = 150) String name,
        @Size(max = 180) String slug,
        String description,
        Long parentId,
        int sortOrder
) {}
