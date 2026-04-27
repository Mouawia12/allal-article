package com.allalarticle.backend.integration.ai.service;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.common.response.PageResponse;
import com.allalarticle.backend.integration.ai.dto.AiJobRequest;
import com.allalarticle.backend.integration.ai.dto.AiJobResponse;
import com.allalarticle.backend.integration.ai.entity.AiJob;
import com.allalarticle.backend.integration.ai.entity.AiJobItem;
import com.allalarticle.backend.integration.ai.repository.AiJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiJobService {

    private final AiJobRepository jobRepo;

    @Transactional(readOnly = true)
    public Page<AiJobResponse> list(String status, Pageable pageable) {
        if (status != null) return jobRepo.findByJobStatus(status, pageable).map(AiJobResponse::from);
        return jobRepo.findAll(pageable).map(AiJobResponse::from);
    }

    @Transactional(readOnly = true)
    public AiJobResponse findById(Long id) {
        return AiJobResponse.from(getOrThrow(id));
    }

    @Transactional
    public AiJobResponse create(AiJobRequest req, Long userId) {
        AiJob job = AiJob.builder()
                .jobType(req.jobType())
                .provider(req.provider())
                .model(req.model())
                .sourceFileId(req.sourceFileId())
                .optionsJson(req.optionsJson())
                .initiatedById(userId)
                .build();

        if (req.items() != null) {
            List<AiJobItem> items = new ArrayList<>();
            for (Map<String, Object> inputData : req.items()) {
                items.add(AiJobItem.builder()
                        .job(job)
                        .rawInputJson(inputData)
                        .build());
            }
            job.getItems().addAll(items);
        }

        AiJob saved = jobRepo.save(job);
        log.info("AI job created: id={}, type={}", saved.getId(), saved.getJobType());
        return AiJobResponse.from(saved);
    }

    @Transactional
    public AiJobResponse updateItemDecision(Long jobId, Long itemId, String decision) {
        AiJob job = getOrThrow(jobId);
        job.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .ifPresent(item -> item.setReviewDecision(decision));
        return AiJobResponse.from(jobRepo.save(job));
    }

    @Transactional
    public AiJobResponse cancel(Long id) {
        AiJob job = getOrThrow(id);
        if ("processing".equals(job.getJobStatus())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "لا يمكن إلغاء مهمة جارية", HttpStatus.BAD_REQUEST);
        }
        job.setJobStatus("cancelled");
        job.setFinishedAt(OffsetDateTime.now());
        return AiJobResponse.from(jobRepo.save(job));
    }

    @Async
    @Transactional
    public void processJob(Long jobId) {
        AiJob job = getOrThrow(jobId);
        if (!"queued".equals(job.getJobStatus())) return;

        job.setJobStatus("processing");
        job.setStartedAt(OffsetDateTime.now());
        jobRepo.save(job);

        try {
            for (AiJobItem item : job.getItems()) {
                item.setItemStatus("processing");
                // Provider-specific processing happens here
                // Integration with Anthropic/OpenAI API would be wired in per jobType
                log.info("Processing AI job item: jobId={}, itemId={}, type={}", jobId, item.getId(), job.getJobType());
                item.setItemStatus("completed");
            }

            job.setJobStatus("completed");
            job.setFinishedAt(OffsetDateTime.now());
            job.setSummaryJson(Map.of("processed", job.getItems().size(), "status", "completed"));
        } catch (Exception e) {
            log.error("AI job processing failed: jobId={}, error={}", jobId, e.getMessage());
            job.setJobStatus("failed");
            job.setFinishedAt(OffsetDateTime.now());
            job.setSummaryJson(Map.of("error", e.getMessage()));
        }
        jobRepo.save(job);
    }

    private AiJob getOrThrow(Long id) {
        return jobRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "مهمة AI غير موجودة", HttpStatus.NOT_FOUND));
    }
}
