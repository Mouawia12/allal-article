package com.allalarticle.backend.accounting.repository;

import com.allalarticle.backend.accounting.entity.ChartTemplateDeployment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChartTemplateDeploymentRepository extends JpaRepository<ChartTemplateDeployment, Long> {
    List<ChartTemplateDeployment> findByTemplateIdOrderByDeployedAtDesc(Long templateId);
}
