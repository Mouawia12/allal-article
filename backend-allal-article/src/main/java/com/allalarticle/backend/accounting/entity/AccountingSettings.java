package com.allalarticle.backend.accounting.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "accounting_settings")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class AccountingSettings {

    @Id
    @Column(name = "key", nullable = false, length = 100)
    private String key;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private Account account;

    @Column(nullable = false, length = 200)
    private String label;

    @Column(name = "group_name", nullable = false, length = 80)
    private String groupName;

    @Column(name = "is_required", nullable = false)
    @Builder.Default
    private boolean required = true;

    @Column(name = "allowed_classification", length = 30)
    private String allowedClassification;

    @Column(name = "requires_control", nullable = false)
    @Builder.Default
    private boolean requiresControl = false;

    @Column(name = "updated_by")
    private Long updatedById;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
