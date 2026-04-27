package com.allalarticle.backend.documents.entity;

import com.allalarticle.backend.customers.entity.Customer;
import com.allalarticle.backend.orders.entity.Order;
import com.allalarticle.backend.reference.entity.Wilaya;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "road_invoices")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class RoadInvoice {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, updatable = false)
    @Builder.Default
    private UUID publicId = UUID.randomUUID();

    @Column(name = "invoice_number", nullable = false, unique = true, length = 50)
    private String invoiceNumber;

    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wilaya_id")
    private Wilaya wilaya;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(name = "driver_id")
    private Long driverId;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "draft";

    @Column(name = "total_weight", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal totalWeight = BigDecimal.ZERO;

    private String notes;

    @Column(name = "print_count", nullable = false)
    @Builder.Default
    private int printCount = 0;

    @Column(name = "last_printed_at")
    private OffsetDateTime lastPrintedAt;

    @Column(name = "last_printed_by")
    private Long lastPrintedById;

    @Column(name = "whatsapp_sent_at")
    private OffsetDateTime whatsappSentAt;

    @Column(name = "created_by")
    private Long createdById;

    @OneToMany(mappedBy = "roadInvoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RoadInvoiceItem> items = new ArrayList<>();

    @ManyToMany
    @JoinTable(
            name = "road_invoice_orders",
            joinColumns = @JoinColumn(name = "road_invoice_id"),
            inverseJoinColumns = @JoinColumn(name = "order_id")
    )
    @Builder.Default
    private Set<Order> linkedOrders = new HashSet<>();

    @CreationTimestamp private OffsetDateTime createdAt;
    @UpdateTimestamp  private OffsetDateTime updatedAt;
}
