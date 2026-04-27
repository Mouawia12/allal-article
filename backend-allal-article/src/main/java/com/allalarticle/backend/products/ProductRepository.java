package com.allalarticle.backend.products;

import com.allalarticle.backend.products.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ProductRepository extends JpaRepository<Product, Long> {

    boolean existsBySku(String sku);

    Page<Product> findByDeletedAtIsNull(Pageable pageable);

    @Query("""
        SELECT p FROM Product p
        WHERE p.deletedAt IS NULL
        AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%'))
          OR LOWER(p.sku)  LIKE LOWER(CONCAT('%', :q, '%'))
          OR p.barcode = :q)
        """)
    Page<Product> search(String q, Pageable pageable);

    @Query("""
        SELECT p FROM Product p
        WHERE p.deletedAt IS NULL
        AND p.category.id = :categoryId
        """)
    Page<Product> findByCategory(Long categoryId, Pageable pageable);
}
