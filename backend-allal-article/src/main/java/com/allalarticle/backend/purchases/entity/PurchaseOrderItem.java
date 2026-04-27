package com.allalarticle.backend.purchases.entity;

import com.allalarticle.backend.products.entity.Product;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "purchase_order_items")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class PurchaseOrderItem {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_id", nullable = false)
    private PurchaseOrder purchaseOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "ordered_qty", nullable = false, precision = 14, scale = 3)
    private BigDecimal orderedQty;

    @Column(name = "received_qty", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal receivedQty = BigDecimal.ZERO;

    @Column(name = "returned_qty", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal returnedQty = BigDecimal.ZERO;

    @Column(name = "pricing_source", nullable = false, length = 40)
    @Builder.Default
    private String pricingSource = "product_default";

    @Column(name = "base_unit_price", precision = 14, scale = 2)
    private BigDecimal baseUnitPrice;

    @Column(name = "unit_price", precision = 14, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "line_subtotal", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal lineSubtotal = BigDecimal.ZERO;

    private String notes;

    @CreationTimestamp private OffsetDateTime createdAt;
}
