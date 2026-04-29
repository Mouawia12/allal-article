package com.allalarticle.backend.customers.entity;

import com.allalarticle.backend.users.entity.TenantUser;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "customer_payments")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class CustomerPayment {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, updatable = false)
    @Builder.Default
    private UUID publicId = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 10)
    private String direction; // in | out

    @Column(name = "payment_method", nullable = false, length = 30)
    private String paymentMethod; // cash | bank | cheque

    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "received_by")
    private TenantUser receivedBy;

    @Column(name = "counterparty_name", length = 200)
    private String counterpartyName;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    private String notes;

    @Column(name = "created_by")
    private Long createdBy;

    @CreationTimestamp
    private OffsetDateTime createdAt;
}
