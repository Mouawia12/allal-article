package com.allalarticle.backend.integration.ai.repository;

import com.allalarticle.backend.integration.ai.entity.AiJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AiJobRepository extends JpaRepository<AiJob, Long> {
    Page<AiJob> findByJobStatus(String status, Pageable pageable);
    List<AiJob> findByJobStatusAndJobType(String status, String jobType);
}
