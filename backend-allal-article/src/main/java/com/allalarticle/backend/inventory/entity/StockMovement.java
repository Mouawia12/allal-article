package com.allalarticle.backend.inventory.entity;

import com.allalarticle.backend.products.entity.Product;
import com.allalarticle.backend.users.entity.TenantUser;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "stock_movements")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class StockMovement {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, updatable = false)
    @Builder.Default
    private UUID publicId = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(name = "movement_type", nullable = false, length = 50)
    private String movementType;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal qty;

    @Column(name = "balance_before", precision = 14, scale = 3)
    private BigDecimal balanceBefore;

    @Column(name = "balance_after", precision = 14, scale = 3)
    private BigDecimal balanceAfter;

    @Column(name = "source_type", length = 50)
    private String sourceType;

    @Column(name = "source_id")
    private Long sourceId;

    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by")
    private TenantUser performedBy;

    @CreationTimestamp
    private OffsetDateTime createdAt;
}
