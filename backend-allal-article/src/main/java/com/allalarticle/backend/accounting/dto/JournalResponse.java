package com.allalarticle.backend.accounting.dto;

import com.allalarticle.backend.accounting.entity.Journal;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record JournalResponse(
        Long id,
        String journalNumber,
        String journalBookCode,
        String journalBookName,
        Long fiscalYearId,
        Long periodId,
        String periodName,
        LocalDate journalDate,
        String status,
        String description,
        String referenceType,
        Long referenceId,
        String referenceNumber,
        BigDecimal totalDebit,
        BigDecimal totalCredit,
        OffsetDateTime createdAt,
        OffsetDateTime postedAt,
        List<ItemResponse> items
) {
    public record ItemResponse(Long id, Long accountId, String accountCode, String accountName,
                               int lineNumber, BigDecimal debit, BigDecimal credit, String description) {}

    public static JournalResponse from(Journal j) {
        var items = j.getItems().stream()
                .map(i -> new ItemResponse(i.getId(), i.getAccount().getId(), i.getAccount().getCode(),
                        i.getAccount().getNameAr(), i.getLineNumber(), i.getDebit(), i.getCredit(), i.getDescription()))
                .toList();
        return new JournalResponse(
                j.getId(), j.getJournalNumber(),
                j.getJournalBook().getCode(), j.getJournalBook().getNameAr(),
                j.getFiscalYear().getId(), j.getPeriod().getId(), j.getPeriod().getName(),
                j.getJournalDate(), j.getStatus(), j.getDescription(),
                j.getReferenceType(), j.getReferenceId(), j.getReferenceNumber(),
                j.getTotalDebit(), j.getTotalCredit(),
                j.getCreatedAt(), j.getPostedAt(), items
        );
    }
}
