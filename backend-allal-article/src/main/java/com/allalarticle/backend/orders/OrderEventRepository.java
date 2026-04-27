package com.allalarticle.backend.orders;

import com.allalarticle.backend.orders.entity.OrderEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderEventRepository extends JpaRepository<OrderEvent, Long> {

    List<OrderEvent> findByOrderIdOrderByCreatedAtDesc(Long orderId);
}
