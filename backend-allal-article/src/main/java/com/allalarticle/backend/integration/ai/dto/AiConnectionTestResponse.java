package com.allalarticle.backend.integration.ai.dto;

public record AiConnectionTestResponse(
        boolean success,
        String provider,
        String model,
        String message
) {}
