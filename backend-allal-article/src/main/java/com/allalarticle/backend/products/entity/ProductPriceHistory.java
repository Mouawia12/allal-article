package com.allalarticle.backend.products.entity;

import com.allalarticle.backend.users.entity.TenantUser;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "product_price_histories")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ProductPriceHistory {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "previous_price_amount", precision = 14, scale = 2)
    private BigDecimal previousPriceAmount;

    @Column(name = "new_price_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal newPriceAmount;

    @Column(name = "price_currency", nullable = false, length = 3)
    @Builder.Default
    private String priceCurrency = "DZD";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by")
    private TenantUser changedBy;

    @Column(name = "change_reason")
    private String changeReason;

    @Column(name = "source_type", length = 50)
    private String sourceType;

    @Column(name = "source_id")
    private Long sourceId;

    @Column(name = "effective_at", nullable = false)
    @Builder.Default
    private OffsetDateTime effectiveAt = OffsetDateTime.now();

    @CreationTimestamp
    private OffsetDateTime createdAt;
}
