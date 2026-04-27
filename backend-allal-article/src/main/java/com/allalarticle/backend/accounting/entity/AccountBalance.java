package com.allalarticle.backend.accounting.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "account_balances",
       uniqueConstraints = @UniqueConstraint(columnNames = {"account_id", "fiscal_year_id", "period_id"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class AccountBalance {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fiscal_year_id", nullable = false)
    private FiscalYear fiscalYear;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "period_id", nullable = false)
    private AccountingPeriod period;

    @Column(name = "opening_debit", nullable = false, precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal openingDebit = BigDecimal.ZERO;

    @Column(name = "opening_credit", nullable = false, precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal openingCredit = BigDecimal.ZERO;

    @Column(name = "period_debit", nullable = false, precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal periodDebit = BigDecimal.ZERO;

    @Column(name = "period_credit", nullable = false, precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal periodCredit = BigDecimal.ZERO;

    @Column(name = "closing_debit", nullable = false, precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal closingDebit = BigDecimal.ZERO;

    @Column(name = "closing_credit", nullable = false, precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal closingCredit = BigDecimal.ZERO;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
