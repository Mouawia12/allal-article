package com.allalarticle.backend.inventory;

import com.allalarticle.backend.inventory.entity.ProductStock;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProductStockRepository extends JpaRepository<ProductStock, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ps FROM ProductStock ps WHERE ps.product.id = :productId AND ps.warehouse.id = :warehouseId")
    Optional<ProductStock> findForUpdate(Long productId, Long warehouseId);

    List<ProductStock> findByProductId(Long productId);

    Page<ProductStock> findByWarehouseId(Long warehouseId, Pageable pageable);

    Page<ProductStock> findAll(Pageable pageable);
}
