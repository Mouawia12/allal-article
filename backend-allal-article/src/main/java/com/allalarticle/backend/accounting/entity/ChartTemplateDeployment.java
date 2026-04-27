package com.allalarticle.backend.accounting.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "chart_template_deployments")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ChartTemplateDeployment {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private AccountTemplate template;

    @Column(name = "accounts_created", nullable = false)
    @Builder.Default
    private int accountsCreated = 0;

    @Column(name = "deployed_by")
    private Long deployedById;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "completed";

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @CreationTimestamp
    private OffsetDateTime deployedAt;
}
