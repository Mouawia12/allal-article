package com.allalarticle.backend.manufacturing.entity;

import com.allalarticle.backend.inventory.entity.Warehouse;
import com.allalarticle.backend.products.entity.Product;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "manufacturing_requests")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ManufacturingRequest {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, updatable = false)
    @Builder.Default
    private UUID publicId = UUID.randomUUID();

    @Column(name = "request_number", nullable = false, unique = true, length = 50)
    private String requestNumber;

    @Column(name = "source_type", nullable = false, length = 40)
    private String sourceType;

    @Column(name = "source_order_id")
    private Long sourceOrderId;

    @Column(name = "source_order_item_id")
    private Long sourceOrderItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "requested_qty", nullable = false, precision = 14, scale = 3)
    private BigDecimal requestedQty;

    @Column(name = "approved_qty", precision = 14, scale = 3)
    private BigDecimal approvedQty;

    @Column(name = "produced_qty", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal producedQty = BigDecimal.ZERO;

    @Column(name = "received_qty", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal receivedQty = BigDecimal.ZERO;

    @Column(name = "unit_name", length = 50)
    private String unitName;

    @Column(nullable = false, length = 40)
    @Builder.Default
    private String status = "draft";

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String priority = "normal";

    @Column(name = "factory_name", length = 180)
    private String factoryName;

    @Column(name = "production_line", length = 180)
    private String productionLine;

    @Column(name = "requested_by")
    private Long requestedById;

    @Column(name = "approved_by")
    private Long approvedById;

    @Column(name = "responsible_user_id")
    private Long responsibleUserId;

    @Column(name = "quality_user_id")
    private Long qualityUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_warehouse_id")
    private Warehouse destinationWarehouse;

    @Column(name = "destination_label", length = 200)
    private String destinationLabel;

    @Column(name = "linked_customer_id")
    private Long linkedCustomerId;

    @Column(name = "customer_snapshot", length = 220)
    private String customerSnapshot;

    @Column(name = "deposit_required", nullable = false)
    @Builder.Default
    private boolean depositRequired = false;

    @Column(name = "deposit_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal depositAmount = BigDecimal.ZERO;

    @Column(name = "deposit_paid_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal depositPaidAmount = BigDecimal.ZERO;

    @Column(name = "deposit_status", nullable = false, length = 30)
    @Builder.Default
    private String depositStatus = "none";

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "shipped_at")
    private OffsetDateTime shippedAt;

    @Column(name = "received_at")
    private OffsetDateTime receivedAt;

    @Column(name = "cancelled_at")
    private OffsetDateTime cancelledAt;

    @Column(name = "cancel_reason")
    private String cancelReason;

    private String notes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata_json", columnDefinition = "jsonb")
    private Map<String, Object> metadataJson;

    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ManufacturingMaterial> materials = new ArrayList<>();

    @CreationTimestamp private OffsetDateTime createdAt;
    @UpdateTimestamp  private OffsetDateTime updatedAt;
}
