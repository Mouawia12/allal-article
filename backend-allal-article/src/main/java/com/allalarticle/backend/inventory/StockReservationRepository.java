package com.allalarticle.backend.inventory;

import com.allalarticle.backend.inventory.entity.StockReservation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockReservationRepository extends JpaRepository<StockReservation, Long> {

    List<StockReservation> findByOrderIdAndStatus(Long orderId, String status);

    List<StockReservation> findByOrderId(Long orderId);
}
