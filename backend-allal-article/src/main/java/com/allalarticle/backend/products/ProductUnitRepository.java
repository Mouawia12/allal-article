package com.allalarticle.backend.products;

import com.allalarticle.backend.products.entity.ProductUnit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductUnitRepository extends JpaRepository<ProductUnit, Long> {

    List<ProductUnit> findAllByOrderByNameAsc();

    Optional<ProductUnit> findByNameIgnoreCase(String name);
}
