package com.allalarticle.backend.integration.ai.dto;

import com.allalarticle.backend.integration.ai.entity.AiJob;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record AiJobResponse(
        Long id,
        UUID publicId,
        String jobType,
        String jobStatus,
        String provider,
        String model,
        Long sourceFileId,
        Map<String, Object> optionsJson,
        Map<String, Object> summaryJson,
        int itemCount,
        OffsetDateTime createdAt,
        OffsetDateTime startedAt,
        OffsetDateTime finishedAt
) {
    public static AiJobResponse from(AiJob j) {
        return new AiJobResponse(j.getId(), j.getPublicId(), j.getJobType(), j.getJobStatus(),
                j.getProvider(), j.getModel(), j.getSourceFileId(), j.getOptionsJson(), j.getSummaryJson(),
                j.getItems().size(), j.getCreatedAt(), j.getStartedAt(), j.getFinishedAt());
    }
}
