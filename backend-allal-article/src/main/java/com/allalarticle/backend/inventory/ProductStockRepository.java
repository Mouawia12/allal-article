package com.allalarticle.backend.inventory;

import com.allalarticle.backend.inventory.entity.ProductStock;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface ProductStockRepository extends JpaRepository<ProductStock, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ps FROM ProductStock ps WHERE ps.product.id = :productId AND ps.warehouse.id = :warehouseId")
    Optional<ProductStock> findForUpdate(Long productId, Long warehouseId);

    List<ProductStock> findByProductId(Long productId);

    /** Total quantity of one product across every warehouse — the basis for its weighted average cost. */
    @Query("SELECT COALESCE(SUM(ps.onHandQty), 0) FROM ProductStock ps WHERE ps.product.id = :productId")
    BigDecimal totalOnHandByProductId(Long productId);

    Page<ProductStock> findByWarehouseId(Long warehouseId, Pageable pageable);
}
