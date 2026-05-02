package com.allalarticle.backend.integration.ai.dto;

import java.util.List;

public record AiSettingsResponse(
        String provider,
        String model,
        String imageModel,
        Boolean extractionEnabled,
        Boolean imageProcessEnabled,
        String imageProcessingPrompt,
        boolean hasOpenAiApiKey,
        String maskedOpenAiApiKey,
        String openAiKeySource,
        List<AiModelOptionResponse> availableTextModels,
        List<AiModelOptionResponse> availableImageModels,
        String modelsRefreshedAt
) {}
