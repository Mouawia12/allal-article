package com.allalarticle.backend.inventory;

import com.allalarticle.backend.inventory.entity.StockCountItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StockCountItemRepository extends JpaRepository<StockCountItem, Long> {

    List<StockCountItem> findByStockCountIdOrderByIdAsc(Long stockCountId);

    Optional<StockCountItem> findByIdAndStockCountId(Long id, Long stockCountId);
}
