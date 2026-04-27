package com.allalarticle.backend.accounting.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "accounting_rules")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class AccountingRule {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rule_code", nullable = false, unique = true, length = 80)
    private String ruleCode;

    @Column(name = "name_ar", nullable = false, length = 200)
    private String nameAr;

    @Column(name = "journal_book_id")
    private Long journalBookId;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @OneToMany(mappedBy = "rule", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AccountingRuleItem> items = new ArrayList<>();

    @CreationTimestamp
    private OffsetDateTime createdAt;
}
