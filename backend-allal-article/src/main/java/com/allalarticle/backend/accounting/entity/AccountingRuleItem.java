package com.allalarticle.backend.accounting.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "accounting_rule_items")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class AccountingRuleItem {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rule_id", nullable = false)
    private AccountingRule rule;

    @Column(name = "line_number", nullable = false)
    private int lineNumber;

    @Column(nullable = false, length = 10)
    private String side; // debit / credit

    @Column(name = "account_source", nullable = false, length = 20)
    private String accountSource; // setting / fixed

    @Column(name = "setting_key", length = 80)
    private String settingKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fixed_account_id")
    private Account fixedAccount;

    @Column(length = 300)
    private String description;
}
