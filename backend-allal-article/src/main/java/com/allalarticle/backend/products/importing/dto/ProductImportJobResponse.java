package com.allalarticle.backend.products.importing.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/**
 * Snapshot of a product-import job. Returned both right after parse start and
 * on each progress poll; the frontend reads {@code stage} + {@code progress}
 * to drive the progress bar, and {@code items} once stage is {@code ready}.
 */
public record ProductImportJobResponse(
        String jobId,
        String stage,           // uploaded | extracting | ai_processing | parsed | ready | failed | irrelevant | done
        int progress,           // 0..100
        String message,         // arabic-friendly stage description
        String filename,
        String fileKind,
        boolean relevant,
        String reason,          // when irrelevant: explanation
        List<ImportedProductPayload> items,
        Map<String, Object> summary,   // populated on confirm
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
