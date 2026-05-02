package com.allalarticle.backend.integration.ai.dto;

public record AiConnectionTestRequest(
        String provider,
        String openAiApiKey,
        String model
) {}
