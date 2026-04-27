package com.allalarticle.backend.products.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "products")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Product {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, updatable = false)
    @Builder.Default
    private UUID publicId = UUID.randomUUID();

    @Column(nullable = false, unique = true, length = 100)
    private String sku;

    @Column(nullable = false, length = 200)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "base_unit_id")
    private ProductUnit baseUnit;

    @Column(length = 100)
    private String barcode;

    @Column(name = "has_variants", nullable = false)
    @Builder.Default
    private boolean hasVariants = false;

    @Column(name = "units_per_package", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal unitsPerPackage = BigDecimal.ONE;

    @Column(name = "current_price_amount", precision = 14, scale = 2)
    private BigDecimal currentPriceAmount;

    @Column(name = "price_currency", nullable = false, length = 3)
    @Builder.Default
    private String priceCurrency = "DZD";

    @Column(name = "min_stock_qty", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal minStockQty = BigDecimal.ZERO;

    private String description;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "active";

    @CreationTimestamp
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;

    private OffsetDateTime deletedAt;
}
