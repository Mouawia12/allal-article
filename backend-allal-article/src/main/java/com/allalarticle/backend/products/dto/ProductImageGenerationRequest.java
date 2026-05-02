package com.allalarticle.backend.products.dto;

public record ProductImageGenerationRequest(
        String name,
        String sku,
        String description,
        String category,
        String baseUnit,
        String packageUnit,
        String extraPrompt
) {}
