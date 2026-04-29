package com.allalarticle.backend.orders;

import com.allalarticle.backend.orders.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Page<Order> findByDeletedAtIsNull(Pageable pageable);

    Page<Order> findByOrderStatusAndDeletedAtIsNull(String status, Pageable pageable);

    Page<Order> findByCustomerIdAndDeletedAtIsNull(Long customerId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.customer.id = :id AND o.deletedAt IS NULL")
    BigDecimal sumTotalByCustomerId(@Param("id") Long id);

    @Query("""
        SELECT o FROM Order o
        WHERE o.orderStatus = 'shipped'
        AND o.shippedAt IS NOT NULL
        AND o.shippedAt < :cutoff
        AND o.deletedAt IS NULL
        """)
    List<Order> findShippedBefore(OffsetDateTime cutoff);
}
