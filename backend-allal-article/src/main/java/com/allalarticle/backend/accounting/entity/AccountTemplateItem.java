package com.allalarticle.backend.accounting.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "account_template_items")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class AccountTemplateItem {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private AccountTemplate template;

    @Column(name = "account_code", nullable = false, length = 30)
    private String accountCode;

    @Column(name = "name_ar", nullable = false, length = 200)
    private String nameAr;

    @Column(name = "name_fr", length = 200)
    private String nameFr;

    @Column(name = "parent_code", length = 30)
    private String parentCode;

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

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;
}
