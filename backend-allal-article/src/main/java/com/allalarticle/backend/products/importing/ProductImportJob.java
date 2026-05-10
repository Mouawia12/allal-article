package com.allalarticle.backend.products.importing;

import com.allalarticle.backend.products.importing.dto.ImportedProductPayload;
import com.allalarticle.backend.products.importing.dto.ProductImportJobResponse;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Mutable in-memory state of a single product-import job. Lives in
 * {@link ProductImportJobStore} until the user finishes (confirm or close)
 * or the eviction timeout fires.
 */
public class ProductImportJob {

    public enum Stage {
        UPLOADED, EXTRACTING, AI_PROCESSING, PARSED, READY, IRRELEVANT, FAILED, DONE
    }

    private final String jobId;
    private final String tenantSchema;
    private final Long initiatedByUserId;
    private final String filename;
    private final String fileKind;
    private final OffsetDateTime createdAt;

    private Stage stage;
    private int progress;
    private String message;
    private boolean relevant = true;
    private String reason;
    private List<ImportedProductPayload> items = new ArrayList<>();
    private Map<String, Object> summary;
    private OffsetDateTime updatedAt;

    public ProductImportJob(String jobId, String tenantSchema, Long initiatedByUserId,
                            String filename, String fileKind) {
        this.jobId = jobId;
        this.tenantSchema = tenantSchema;
        this.initiatedByUserId = initiatedByUserId;
        this.filename = filename;
        this.fileKind = fileKind;
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = this.createdAt;
        this.stage = Stage.UPLOADED;
        this.progress = 5;
        this.message = "تم استلام الملف";
    }

    public synchronized void update(Stage stage, int progress, String message) {
        this.stage = stage;
        this.progress = Math.max(this.progress, progress);
        this.message = message;
        this.updatedAt = OffsetDateTime.now();
    }

    public synchronized void markIrrelevant(String reason) {
        this.relevant = false;
        this.reason = reason;
        this.stage = Stage.IRRELEVANT;
        this.progress = 100;
        this.message = "الملف لا يحتوي بيانات أصناف";
        this.updatedAt = OffsetDateTime.now();
    }

    public synchronized void markReady(List<ImportedProductPayload> items) {
        this.items = items != null ? items : new ArrayList<>();
        this.stage = Stage.READY;
        this.progress = 100;
        this.message = "تم استخراج " + this.items.size() + " صنف، بانتظار المراجعة";
        this.updatedAt = OffsetDateTime.now();
    }

    public synchronized void markFailed(String reason) {
        this.reason = reason;
        this.stage = Stage.FAILED;
        this.progress = 100;
        this.message = "فشل المعالجة";
        this.updatedAt = OffsetDateTime.now();
    }

    public synchronized void markDone(Map<String, Object> summary) {
        this.summary = summary;
        this.stage = Stage.DONE;
        this.progress = 100;
        this.message = "تم حفظ الأصناف";
        this.updatedAt = OffsetDateTime.now();
    }

    public synchronized ProductImportJobResponse snapshot() {
        return new ProductImportJobResponse(
                jobId,
                stage.name().toLowerCase(),
                progress,
                message,
                filename,
                fileKind,
                relevant,
                reason,
                stage == Stage.READY || stage == Stage.DONE ? List.copyOf(items) : List.of(),
                summary,
                createdAt,
                updatedAt
        );
    }

    public String jobId() { return jobId; }
    public String tenantSchema() { return tenantSchema; }
    public Long initiatedByUserId() { return initiatedByUserId; }
    public Stage stage() { return stage; }
    public List<ImportedProductPayload> items() { return items; }
    public OffsetDateTime updatedAt() { return updatedAt; }
}
