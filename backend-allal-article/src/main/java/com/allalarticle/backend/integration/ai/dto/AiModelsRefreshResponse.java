package com.allalarticle.backend.integration.ai.dto;

import java.util.List;

public record AiModelsRefreshResponse(
        List<AiModelOptionResponse> textModels,
        List<AiModelOptionResponse> imageModels,
        String refreshedAt
) {}
