package com.allalarticle.backend.products.dto;

import com.allalarticle.backend.storage.dto.MediaAssetResponse;

public record ProductImageGenerationResponse(
        MediaAssetResponse media,
        String model,
        String prompt,
        String revisedPrompt
) {}
