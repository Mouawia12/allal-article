package com.allalarticle.backend.orders.entity;

import com.allalarticle.backend.products.entity.Product;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "order_items")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class OrderItem {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, updatable = false)
    @Builder.Default
    private UUID publicId = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "line_number", nullable = false)
    private int lineNumber;

    @Column(name = "line_status", nullable = false, length = 40)
    @Builder.Default
    private String lineStatus = "pending";

    @Column(name = "requested_qty", nullable = false, precision = 14, scale = 3)
    private BigDecimal requestedQty;

    @Column(name = "approved_qty", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal approvedQty = BigDecimal.ZERO;

    @Column(name = "shipped_qty", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal shippedQty = BigDecimal.ZERO;

    @Column(name = "returned_qty", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal returnedQty = BigDecimal.ZERO;

    @Column(name = "cancelled_qty", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal cancelledQty = BigDecimal.ZERO;

    @Column(name = "price_list_id")
    private Long priceListId;

    @Column(name = "price_list_item_id")
    private Long priceListItemId;

    @Column(name = "price_list_name_snapshot", length = 160)
    private String priceListNameSnapshot;

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

    @Column(name = "line_weight", precision = 14, scale = 3)
    private BigDecimal lineWeight;

    @Column(name = "is_shipping_required", nullable = false)
    @Builder.Default
    private boolean shippingRequired = true;

    @Column(name = "customer_note")
    private String customerNote;

    @Column(name = "internal_note")
    private String internalNote;

    @CreationTimestamp
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;
}
