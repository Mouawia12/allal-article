package com.allalarticle.backend.manufacturing.entity;

import com.allalarticle.backend.inventory.entity.Warehouse;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "manufacturing_receipts")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ManufacturingReceipt {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manufacturing_request_id", nullable = false)
    private ManufacturingRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(name = "received_qty", nullable = false, precision = 14, scale = 3)
    private BigDecimal receivedQty;

    @Column(name = "accepted_qty", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal acceptedQty = BigDecimal.ZERO;

    @Column(name = "quarantine_qty", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal quarantineQty = BigDecimal.ZERO;

    @Column(name = "stock_movement_id")
    private Long stockMovementId;

    @Column(name = "received_by")
    private Long receivedById;

    @Column(name = "received_at", nullable = false)
    @Builder.Default
    private OffsetDateTime receivedAt = OffsetDateTime.now();

    private String notes;
}
