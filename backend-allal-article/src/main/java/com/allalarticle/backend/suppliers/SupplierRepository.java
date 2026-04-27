package com.allalarticle.backend.suppliers;

import com.allalarticle.backend.suppliers.entity.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    Page<Supplier> findByStatus(String status, Pageable pageable);

    @Query("""
        SELECT s FROM Supplier s
        WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :q, '%'))
           OR s.phone LIKE CONCAT('%', :q, '%')
           OR LOWER(s.taxNumber) LIKE LOWER(CONCAT('%', :q, '%'))
        """)
    Page<Supplier> search(String q, Pageable pageable);
}
