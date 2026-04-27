package com.allalarticle.backend.integration.ai.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.Map;

public record AiJobRequest(
        @NotBlank String jobType,
        String provider,
        String model,
        Long sourceFileId,
        Map<String, Object> optionsJson,
        List<Map<String, Object>> items
) {}
