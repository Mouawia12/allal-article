package com.allalarticle.backend.accounting.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "journal_items")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class JournalItem {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_id", nullable = false)
    private Journal journal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(name = "line_number", nullable = false)
    private int lineNumber;

    @Column(nullable = false, precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal debit = BigDecimal.ZERO;

    @Column(nullable = false, precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal credit = BigDecimal.ZERO;

    @Column(length = 300)
    private String description;

    @Column(name = "cost_center", length = 60)
    private String costCenter;
}
