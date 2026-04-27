package com.allalarticle.backend.manufacturing.repository;

import com.allalarticle.backend.manufacturing.entity.ManufacturingQualityCheck;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ManufacturingQualityCheckRepository extends JpaRepository<ManufacturingQualityCheck, Long> {
    List<ManufacturingQualityCheck> findByRequestIdOrderByCheckedAtDesc(Long requestId);
}
