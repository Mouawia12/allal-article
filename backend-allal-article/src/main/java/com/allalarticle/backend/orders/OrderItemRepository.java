package com.allalarticle.backend.orders;

import com.allalarticle.backend.orders.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderIdAndDeletedAtIsNull(Long orderId);
}
