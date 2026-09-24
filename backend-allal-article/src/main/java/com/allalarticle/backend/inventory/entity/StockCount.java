package com.allalarticle.backend.inventory.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * One physical inventory count of one warehouse.
 *
 * Lifecycle: open → review → approved, or cancelled from either of the first two. Quantities in
 * the system only change at approval, so a count can be recorded, checked and recounted without
 * touching live stock.
 */
@Entity
@Table(name = "stock_counts")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class StockCount {

    public static final String OPEN = "open";
    public static final String REVIEW = "review";
    public static final String APPROVED = "approved";
    public static final String CANCELLED = "cancelled";

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, updatable = false)
    @Builder.Default
    private UUID publicId = UUID.randomUUID();

    @Column(nullable = false, length = 40)
    private String reference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = OPEN;

    /** Counters do not see the system quantity while counting. */
    @Column(nullable = false)
    @Builder.Default
    private boolean blind = true;

    @Column(name = "scheduled_for")
    private LocalDate scheduledFor;

    private String notes;

    @Column(name = "created_by")
    private Long createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "closed_by")
    private Long closedBy;

    @Column(name = "closed_at")
    private OffsetDateTime closedAt;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;

    /** The journal entry this count produced, once approved. */
    @Column(name = "journal_number", length = 40)
    private String journalNumber;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "stockCount", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StockCountItem> items = new ArrayList<>();

    public boolean isEditable() {
        return OPEN.equals(status) || REVIEW.equals(status);
    }
}
