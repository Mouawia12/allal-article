package com.allalarticle.backend.manufacturing.repository;

import com.allalarticle.backend.manufacturing.entity.ManufacturingMaterial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ManufacturingMaterialRepository extends JpaRepository<ManufacturingMaterial, Long> {
    List<ManufacturingMaterial> findByRequestId(Long requestId);
}
