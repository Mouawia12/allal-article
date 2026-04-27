package com.allalarticle.backend.accounting.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record GeneralLedgerResponse(
        Long accountId,
        String accountCode,
        String accountName,
        BigDecimal openingBalance,
        List<LedgerLine> lines,
        BigDecimal totalDebit,
        BigDecimal totalCredit,
        BigDecimal closingBalance
) {
    public record LedgerLine(
            LocalDate date,
            String journalNumber,
            String description,
            String referenceNumber,
            BigDecimal debit,
            BigDecimal credit,
            BigDecimal runningBalance
    ) {}
}
