package com.allalarticle.backend.customers;

import com.allalarticle.backend.customers.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Page<Customer> findByDeletedAtIsNull(Pageable pageable);

    @Query("""
        SELECT c FROM Customer c
        WHERE c.deletedAt IS NULL
        AND (LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%'))
          OR c.phone LIKE CONCAT('%', :q, '%'))
        """)
    Page<Customer> search(String q, Pageable pageable);
}
