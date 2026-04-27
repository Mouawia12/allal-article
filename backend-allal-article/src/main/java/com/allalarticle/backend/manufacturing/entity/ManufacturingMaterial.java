package com.allalarticle.backend.manufacturing.entity;

import com.allalarticle.backend.inventory.entity.Warehouse;
import com.allalarticle.backend.products.entity.Product;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "manufacturing_request_materials")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ManufacturingMaterial {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manufacturing_request_id", nullable = false)
    private ManufacturingRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_product_id", nullable = false)
    private Product materialProduct;

    @Column(name = "planned_qty", nullable = false, precision = 14, scale = 3)
    private BigDecimal plannedQty;

    @Column(name = "reserved_qty", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal reservedQty = BigDecimal.ZERO;

    @Column(name = "consumed_qty", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal consumedQty = BigDecimal.ZERO;

    @Column(name = "waste_qty", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal wasteQty = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id")
    private Warehouse warehouse;

    @Column(name = "unit_cost_amount", precision = 14, scale = 4)
    private BigDecimal unitCostAmount;

    private String notes;

    @CreationTimestamp private OffsetDateTime createdAt;
    @UpdateTimestamp  private OffsetDateTime updatedAt;
}
