package com.allalarticle.backend.products.importing;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe in-memory store of product-import jobs. Jobs are short-lived
 * (typically &lt; 5 min) so we don't persist them; a scheduled task evicts
 * jobs older than 1 hour to keep memory bounded.
 */
@Component
public class ProductImportJobStore {

    private static final Duration JOB_TTL = Duration.ofHours(1);

    private final Map<String, ProductImportJob> jobs = new ConcurrentHashMap<>();

    public ProductImportJob create(String tenantSchema, Long userId, String filename, String fileKind) {
        String jobId = UUID.randomUUID().toString();
        ProductImportJob job = new ProductImportJob(jobId, tenantSchema, userId, filename, fileKind);
        jobs.put(jobId, job);
        return job;
    }

    public ProductImportJob require(String jobId, String tenantSchema) {
        ProductImportJob job = jobs.get(jobId);
        if (job == null) {
            throw new AppException(ErrorCode.NOT_FOUND, "مهمة الاستيراد غير موجودة", HttpStatus.NOT_FOUND);
        }
        if (!tenantSchema.equals(job.tenantSchema())) {
            throw new AppException(ErrorCode.NOT_FOUND, "مهمة الاستيراد غير موجودة", HttpStatus.NOT_FOUND);
        }
        return job;
    }

    public void remove(String jobId) {
        jobs.remove(jobId);
    }

    @Scheduled(fixedDelay = 15 * 60 * 1000L)
    public void evictExpired() {
        OffsetDateTime cutoff = OffsetDateTime.now().minus(JOB_TTL);
        jobs.entrySet().removeIf(e -> e.getValue().updatedAt().isBefore(cutoff));
    }
}
