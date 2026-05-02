package com.allalarticle.backend.integration.ai.dto;

public record AiModelOptionResponse(
        String id,
        String label,
        String family,
        Long created,
        String ownedBy
) {}
