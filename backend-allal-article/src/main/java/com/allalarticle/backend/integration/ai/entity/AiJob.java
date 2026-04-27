package com.allalarticle.backend.integration.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "ai_jobs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class AiJob {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, updatable = false)
    @Builder.Default
    private UUID publicId = UUID.randomUUID();

    @Column(name = "job_type", nullable = false, length = 80)
    private String jobType;

    @Column(name = "job_status", nullable = false, length = 40)
    @Builder.Default
    private String jobStatus = "queued";

    @Column(length = 50)
    private String provider;

    @Column(length = 80)
    private String model;

    @Column(name = "initiated_by")
    private Long initiatedById;

    @Column(name = "source_file_id")
    private Long sourceFileId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "options_json", columnDefinition = "jsonb")
    private Map<String, Object> optionsJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "summary_json", columnDefinition = "jsonb")
    private Map<String, Object> summaryJson;

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "finished_at")
    private OffsetDateTime finishedAt;

    @OneToMany(mappedBy = "job", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AiJobItem> items = new ArrayList<>();

    @CreationTimestamp private OffsetDateTime createdAt;
    @UpdateTimestamp  private OffsetDateTime updatedAt;
}
