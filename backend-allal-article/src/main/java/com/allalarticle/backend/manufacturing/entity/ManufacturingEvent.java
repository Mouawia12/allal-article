package com.allalarticle.backend.manufacturing.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.Map;

@Entity
@Table(name = "manufacturing_events")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ManufacturingEvent {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manufacturing_request_id", nullable = false)
    private ManufacturingRequest request;

    @Column(name = "event_type", nullable = false, length = 60)
    private String eventType;

    @Column(name = "old_status", length = 40)
    private String oldStatus;

    @Column(name = "new_status", length = 40)
    private String newStatus;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "payload_json", columnDefinition = "jsonb")
    private Map<String, Object> payloadJson;

    @Column(name = "performed_by")
    private Long performedById;

    @CreationTimestamp
    private OffsetDateTime createdAt;
}
