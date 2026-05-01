package com.allalarticle.backend.inventory;

import com.allalarticle.backend.inventory.entity.StockMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    Page<StockMovement> findByProductId(Long productId, Pageable pageable);

    Page<StockMovement> findByWarehouseId(Long warehouseId, Pageable pageable);

    Page<StockMovement> findByProductIdAndWarehouseId(Long productId, Long warehouseId, Pageable pageable);

    Optional<StockMovement> findFirstBySourceTypeAndSourceIdAndMovementTypeOrderByCreatedAtDesc(
            String sourceType, Long sourceId, String movementType);
}
