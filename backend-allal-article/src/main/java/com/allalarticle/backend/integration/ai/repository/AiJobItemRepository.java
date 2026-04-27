package com.allalarticle.backend.integration.ai.repository;

import com.allalarticle.backend.integration.ai.entity.AiJobItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AiJobItemRepository extends JpaRepository<AiJobItem, Long> {
    List<AiJobItem> findByJobId(Long jobId);
    List<AiJobItem> findByJobIdAndItemStatus(Long jobId, String status);
}
