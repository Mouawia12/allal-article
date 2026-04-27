package com.allalarticle.backend.manufacturing.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;

@Entity
@Table(name = "manufacturing_quality_checks")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ManufacturingQualityCheck {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manufacturing_request_id", nullable = false)
    private ManufacturingRequest request;

    @Column(name = "checked_by")
    private Long checkedById;

    @Column(nullable = false, length = 30)
    private String result;

    @Column(name = "checked_qty", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal checkedQty = BigDecimal.ZERO;

    @Column(name = "passed_qty", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal passedQty = BigDecimal.ZERO;

    @Column(name = "rework_qty", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal reworkQty = BigDecimal.ZERO;

    @Column(name = "rejected_qty", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal rejectedQty = BigDecimal.ZERO;

    private String notes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attachments_json", columnDefinition = "jsonb")
    private Map<String, Object> attachmentsJson;

    @Column(name = "checked_at", nullable = false)
    @Builder.Default
    private OffsetDateTime checkedAt = OffsetDateTime.now();
}
