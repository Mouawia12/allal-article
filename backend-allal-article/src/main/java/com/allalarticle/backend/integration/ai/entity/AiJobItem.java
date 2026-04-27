package com.allalarticle.backend.integration.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.Map;

@Entity
@Table(name = "ai_job_items")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class AiJobItem {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ai_job_id", nullable = false)
    private AiJob job;

    @Column(name = "item_status", nullable = false, length = 40)
    @Builder.Default
    private String itemStatus = "pending";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_input_json", columnDefinition = "jsonb")
    private Map<String, Object> rawInputJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "parsed_output_json", columnDefinition = "jsonb")
    private Map<String, Object> parsedOutputJson;

    @Column(name = "review_decision", nullable = false, length = 30)
    @Builder.Default
    private String reviewDecision = "pending";

    @Column(name = "error_message")
    private String errorMessage;

    @CreationTimestamp private OffsetDateTime createdAt;
    @UpdateTimestamp  private OffsetDateTime updatedAt;
}
