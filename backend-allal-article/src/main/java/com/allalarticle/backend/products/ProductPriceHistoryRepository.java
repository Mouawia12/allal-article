package com.allalarticle.backend.products;

import com.allalarticle.backend.products.entity.ProductPriceHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductPriceHistoryRepository extends JpaRepository<ProductPriceHistory, Long> {

    List<ProductPriceHistory> findByProductIdOrderByEffectiveAtDescCreatedAtDesc(Long productId);
}
