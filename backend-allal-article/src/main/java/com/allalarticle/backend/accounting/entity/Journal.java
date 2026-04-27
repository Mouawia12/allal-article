package com.allalarticle.backend.accounting.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "journals")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Journal {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "journal_number", nullable = false, unique = true, length = 50)
    private String journalNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_book_id", nullable = false)
    private JournalBook journalBook;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fiscal_year_id", nullable = false)
    private FiscalYear fiscalYear;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "period_id", nullable = false)
    private AccountingPeriod period;

    @Column(name = "journal_date", nullable = false)
    private LocalDate journalDate;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "draft";

    @Column(nullable = false, length = 500)
    @Builder.Default
    private String description = "";

    @Column(name = "reference_type", length = 60)
    private String referenceType;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "reference_number", length = 80)
    private String referenceNumber;

    @Column(name = "total_debit", nullable = false, precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal totalDebit = BigDecimal.ZERO;

    @Column(name = "total_credit", nullable = false, precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal totalCredit = BigDecimal.ZERO;

    @Column(name = "created_by")
    private Long createdById;

    @Column(name = "posted_by")
    private Long postedById;

    @Column(name = "posted_at")
    private OffsetDateTime postedAt;

    @OneToMany(mappedBy = "journal", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<JournalItem> items = new ArrayList<>();

    @CreationTimestamp private OffsetDateTime createdAt;
    @UpdateTimestamp  private OffsetDateTime updatedAt;
}
