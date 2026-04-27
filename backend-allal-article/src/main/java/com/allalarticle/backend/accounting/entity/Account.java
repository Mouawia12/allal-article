package com.allalarticle.backend.accounting.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "accounts")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Account {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, updatable = false)
    @Builder.Default
    private UUID publicId = UUID.randomUUID();

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @Column(name = "name_ar", nullable = false, length = 200)
    private String nameAr;

    @Column(name = "name_fr", length = 200)
    private String nameFr;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Account parent;

    @Column(nullable = false, length = 30)
    private String classification;

    @Column(name = "financial_statement", length = 40)
    private String financialStatement;

    @Column(name = "normal_balance", nullable = false, length = 10)
    private String normalBalance;

    @Column(name = "report_section", length = 60)
    private String reportSection;

    @Column(name = "statement_line_code", length = 60)
    private String statementLineCode;

    @Column(name = "statement_sort_order", nullable = false)
    @Builder.Default
    private int statementSortOrder = 0;

    @Column(name = "is_postable", nullable = false)
    @Builder.Default
    private boolean postable = true;

    @Column(name = "is_control", nullable = false)
    @Builder.Default
    private boolean control = false;

    @Column(name = "allow_manual_posting", nullable = false)
    @Builder.Default
    private boolean allowManualPosting = true;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "DZD";

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "active";

    private short level;

    private String path;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

    @Column(name = "template_item_id")
    private Long templateItemId;

    @Column(name = "is_template_locked", nullable = false)
    @Builder.Default
    private boolean templateLocked = false;

    @Column(name = "is_custom", nullable = false)
    @Builder.Default
    private boolean custom = false;

    @Column(name = "created_by")
    private Long createdById;

    @CreationTimestamp private OffsetDateTime createdAt;
    @UpdateTimestamp  private OffsetDateTime updatedAt;
    @Column(name = "deleted_at") private OffsetDateTime deletedAt;
}
