package com.allalarticle.backend.inventory.entity;

import com.allalarticle.backend.products.entity.Product;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "product_stocks",
       uniqueConstraints = @UniqueConstraint(columnNames = {"product_id", "warehouse_id"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ProductStock {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(name = "on_hand_qty", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal onHandQty = BigDecimal.ZERO;

    @Column(name = "reserved_qty", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal reservedQty = BigDecimal.ZERO;

    @Column(name = "pending_qty", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal pendingQty = BigDecimal.ZERO;

    @Column(name = "available_qty", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal availableQty = BigDecimal.ZERO;

    @Column(name = "projected_qty", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal projectedQty = BigDecimal.ZERO;

    @Column(name = "last_recomputed_at")
    private OffsetDateTime lastRecomputedAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
