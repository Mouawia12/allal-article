package com.allalarticle.backend.returns.entity;

import com.allalarticle.backend.orders.entity.OrderItem;
import com.allalarticle.backend.products.entity.Product;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "return_items")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ReturnItem {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "return_id", nullable = false)
    private Return returnEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id")
    private OrderItem orderItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "returned_qty", nullable = false, precision = 14, scale = 3)
    private BigDecimal returnedQty;

    @Column(name = "accepted_qty", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal acceptedQty = BigDecimal.ZERO;

    @Column(name = "condition_status", length = 40)
    private String conditionStatus;

    private String notes;
}
