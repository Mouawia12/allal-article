package com.allalarticle.backend.products.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "product_units_catalog")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ProductUnit {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String name;

    @Column(length = 20)
    private String symbol;

    @Column(name = "is_system", nullable = false)
    @Builder.Default
    private boolean system = false;

    @CreationTimestamp
    private OffsetDateTime createdAt;
}
