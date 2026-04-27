package com.allalarticle.backend.accounting.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "opening_balances",
       uniqueConstraints = @UniqueConstraint(columnNames = {"account_id", "fiscal_year_id"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class OpeningBalance {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fiscal_year_id", nullable = false)
    private FiscalYear fiscalYear;

    @Column(name = "debit_balance", nullable = false, precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal debitBalance = BigDecimal.ZERO;

    @Column(name = "credit_balance", nullable = false, precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal creditBalance = BigDecimal.ZERO;

    @Column(name = "created_by")
    private Long createdById;

    @CreationTimestamp
    private OffsetDateTime createdAt;
}
