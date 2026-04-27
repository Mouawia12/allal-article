package com.allalarticle.backend.orders.entity;

import com.allalarticle.backend.customers.entity.Customer;
import com.allalarticle.backend.users.entity.TenantUser;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Order {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, updatable = false)
    @Builder.Default
    private UUID publicId = UUID.randomUUID();

    @Column(name = "order_number", nullable = false, unique = true, length = 50)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_user_id")
    private TenantUser salesUser;

    @Column(name = "origin_channel", nullable = false, length = 40)
    @Builder.Default
    private String originChannel = "manual";

    @Column(name = "order_status", nullable = false, length = 40)
    @Builder.Default
    private String orderStatus = "draft";

    @Column(name = "shipping_status", nullable = false, length = 40)
    @Builder.Default
    private String shippingStatus = "none";

    @Column(name = "payment_status", nullable = false, length = 30)
    @Builder.Default
    private String paymentStatus = "unpaid";

    @Column(name = "price_currency", nullable = false, length = 3)
    @Builder.Default
    private String priceCurrency = "DZD";

    private String notes;

    @Column(name = "internal_notes")
    private String internalNotes;

    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "total_weight", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal totalWeight = BigDecimal.ZERO;

    @Column(name = "created_by") private Long createdById;
    @Column(name = "confirmed_by") private Long confirmedById;
    @Column(name = "shipped_by") private Long shippedById;
    @Column(name = "completed_by") private Long completedById;
    @Column(name = "cancelled_by") private Long cancelledById;
    @Column(name = "rejected_by") private Long rejectedById;

    @Column(name = "submitted_at") private OffsetDateTime submittedAt;
    @Column(name = "confirmed_at") private OffsetDateTime confirmedAt;
    @Column(name = "shipped_at") private OffsetDateTime shippedAt;
    @Column(name = "completed_at") private OffsetDateTime completedAt;
    @Column(name = "auto_completed_at") private OffsetDateTime autoCompletedAt;
    @Column(name = "cancelled_at") private OffsetDateTime cancelledAt;
    @Column(name = "rejected_at") private OffsetDateTime rejectedAt;
    @Column(name = "completion_due_at") private OffsetDateTime completionDueAt;
    @Column(name = "deleted_at") private OffsetDateTime deletedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @CreationTimestamp
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
