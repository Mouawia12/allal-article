package com.allalarticle.backend.manufacturing.repository;

import com.allalarticle.backend.manufacturing.entity.ManufacturingRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ManufacturingRequestRepository extends JpaRepository<ManufacturingRequest, Long> {
    Optional<ManufacturingRequest> findByRequestNumber(String requestNumber);
    Page<ManufacturingRequest> findByStatus(String status, Pageable pageable);
    Page<ManufacturingRequest> findByProductId(Long productId, Pageable pageable);

    @Query("SELECT mr FROM ManufacturingRequest mr WHERE mr.status NOT IN ('received','cancelled') ORDER BY mr.dueDate ASC NULLS LAST")
    List<ManufacturingRequest> findActive();
}
