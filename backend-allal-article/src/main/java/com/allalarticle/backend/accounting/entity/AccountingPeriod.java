package com.allalarticle.backend.accounting.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "accounting_periods",
       uniqueConstraints = @UniqueConstraint(columnNames = {"fiscal_year_id", "period_number"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class AccountingPeriod {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fiscal_year_id", nullable = false)
    private FiscalYear fiscalYear;

    @Column(name = "period_number", nullable = false)
    private short periodNumber;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "open";

    @Column(name = "closed_at")
    private OffsetDateTime closedAt;

    @Column(name = "closed_by")
    private Long closedById;
}
