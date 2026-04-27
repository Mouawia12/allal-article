package com.allalarticle.backend.manufacturing.repository;

import com.allalarticle.backend.manufacturing.entity.ManufacturingReceipt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ManufacturingReceiptRepository extends JpaRepository<ManufacturingReceipt, Long> {
    List<ManufacturingReceipt> findByRequestId(Long requestId);
}
