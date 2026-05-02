package com.allalarticle.backend.purchases.entity;

import com.allalarticle.backend.suppliers.entity.Supplier;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "purchase_orders")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class PurchaseOrder {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, updatable = false)
    @Builder.Default
    private UUID publicId = UUID.randomUUID();

    @Column(name = "po_number", nullable = false, unique = true, length = 50)
    private String poNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Column(name = "supplier_name", nullable = false, length = 200)
    private String supplierName;

    @Column(name = "origin_channel", nullable = false, length = 40)
    @Builder.Default
    private String originChannel = "manual";

    @Column(name = "linked_partner_uuid")
    private UUID linkedPartnerUuid;

    @Column(name = "linked_partnership_public_id")
    private UUID linkedPartnershipPublicId;

    @Column(name = "partner_document_link_public_id")
    private UUID partnerDocumentLinkPublicId;

    @Column(name = "partner_source_document_public_id")
    private UUID partnerSourceDocumentPublicId;

    @Column(name = "partner_sync_status", nullable = false, length = 40)
    @Builder.Default
    private String partnerSyncStatus = "none";

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "draft";

    @Column(name = "payment_status", nullable = false, length = 30)
    @Builder.Default
    private String paymentStatus = "unpaid";

    @Column(name = "price_currency", nullable = false, length = 3)
    @Builder.Default
    private String priceCurrency = "DZD";

    @Column(name = "expected_date")
    private LocalDate expectedDate;

    @Column(name = "received_date")
    private LocalDate receivedDate;

    @Column(name = "received_by") private Long receivedById;
    @Column(name = "cancelled_by") private Long cancelledById;
    @Column(name = "cancelled_at") private OffsetDateTime cancelledAt;
    @Column(name = "created_by") private Long createdById;

    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    private String notes;

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PurchaseOrderItem> items = new ArrayList<>();

    @CreationTimestamp private OffsetDateTime createdAt;
    @UpdateTimestamp  private OffsetDateTime updatedAt;
}
