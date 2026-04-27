package com.allalarticle.backend.manufacturing.repository;

import com.allalarticle.backend.manufacturing.entity.ManufacturingEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ManufacturingEventRepository extends JpaRepository<ManufacturingEvent, Long> {
    List<ManufacturingEvent> findByRequestIdOrderByCreatedAtAsc(Long requestId);
}
