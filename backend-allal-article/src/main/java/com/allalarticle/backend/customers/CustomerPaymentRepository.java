package com.allalarticle.backend.customers;

import com.allalarticle.backend.customers.entity.CustomerPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;

public interface CustomerPaymentRepository extends JpaRepository<CustomerPayment, Long> {
    List<CustomerPayment> findByCustomerIdOrderByPaymentDateDescCreatedAtDesc(Long customerId);

    @Query("SELECT COALESCE(SUM(CASE WHEN p.direction = 'in' THEN p.amount ELSE -p.amount END), 0) FROM CustomerPayment p WHERE p.customer.id = :id")
    BigDecimal sumNetByCustomerId(@Param("id") Long id);

    /** Batch variant of {@link #sumNetByCustomerId}: returns rows of [customerId, netSum] for the given ids. */
    @Query("SELECT p.customer.id, COALESCE(SUM(CASE WHEN p.direction = 'in' THEN p.amount ELSE -p.amount END), 0) FROM CustomerPayment p WHERE p.customer.id IN :ids GROUP BY p.customer.id")
    List<Object[]> sumNetGroupedByCustomerIds(@Param("ids") Collection<Long> ids);
}
