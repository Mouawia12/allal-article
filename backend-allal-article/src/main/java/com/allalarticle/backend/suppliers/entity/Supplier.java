package com.allalarticle.backend.suppliers.entity;

import com.allalarticle.backend.reference.entity.Wilaya;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "suppliers")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Supplier {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, updatable = false)
    @Builder.Default
    private UUID publicId = UUID.randomUUID();

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "legal_name", length = 200)
    private String legalName;

    @Column(length = 50)
    private String phone;

    @Column(length = 150)
    private String email;

    @Column(name = "tax_number", length = 80)
    private String taxNumber;

    @Column(name = "commercial_register", length = 80)
    private String commercialRegister;

    @Column(name = "nis_number", length = 80)
    private String nisNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wilaya_id")
    private Wilaya wilaya;

    private String address;

    @Column(length = 80)
    private String category;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "active";

    @Column(name = "payment_terms", length = 120)
    private String paymentTerms;

    @Column(name = "opening_balance", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal openingBalance = BigDecimal.ZERO;

    @Column(name = "price_list_id")
    private Long priceListId;

    @Column(name = "linked_partner_uuid")
    private UUID linkedPartnerUuid;

    @Column(name = "linked_partnership_public_id")
    private UUID linkedPartnershipPublicId;

    @Column(name = "link_match_method", length = 50)
    private String linkMatchMethod;

    @Column(name = "link_match_status", nullable = false, length = 30)
    @Builder.Default
    private String linkMatchStatus = "none";

    @Column(name = "link_confirmed_by")
    private Long linkConfirmedById;

    @Column(name = "link_confirmed_at")
    private OffsetDateTime linkConfirmedAt;

    private String notes;

    @Column(name = "created_by")
    private Long createdById;

    @CreationTimestamp
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
