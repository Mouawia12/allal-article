package com.allalarticle.backend.documents.entity;

import com.allalarticle.backend.products.entity.Product;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.Map;

@Entity
@Table(name = "road_invoice_items")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class RoadInvoiceItem {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "road_invoice_id", nullable = false)
    private RoadInvoice roadInvoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal quantity;

    @Column(name = "unit_price", precision = 14, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "line_weight", precision = 14, scale = 3)
    private BigDecimal lineWeight;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "source_json", columnDefinition = "jsonb")
    private Map<String, Object> sourceJson;

    private String notes;
}
