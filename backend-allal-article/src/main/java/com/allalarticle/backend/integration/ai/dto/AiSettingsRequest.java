package com.allalarticle.backend.integration.ai.dto;

public record AiSettingsRequest(
        String provider,
        String openAiApiKey,
        Boolean clearOpenAiApiKey,
        String model,
        String imageModel,
        Boolean extractionEnabled,
        Boolean imageProcessEnabled,
        String imageProcessingPrompt
) {}
