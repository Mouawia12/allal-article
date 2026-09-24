package com.allalarticle.backend.inventory;

import com.allalarticle.backend.inventory.entity.StockCount;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface StockCountRepository extends JpaRepository<StockCount, Long> {

    Page<StockCount> findByStatus(String status, Pageable pageable);

    Page<StockCount> findByWarehouseId(Long warehouseId, Pageable pageable);

    /** A warehouse may only have one count running at a time, or two counts would fight over the same stock. */
    Optional<StockCount> findFirstByWarehouseIdAndStatusIn(Long warehouseId, java.util.Collection<String> statuses);

    @Query("SELECT COUNT(c) FROM StockCount c WHERE YEAR(c.createdAt) = :year")
    long countInYear(int year);
}
