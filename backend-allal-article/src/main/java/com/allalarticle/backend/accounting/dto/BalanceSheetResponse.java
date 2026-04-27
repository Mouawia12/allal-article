package com.allalarticle.backend.accounting.dto;

import java.math.BigDecimal;
import java.util.List;

public record BalanceSheetResponse(
        Long fiscalYearId,
        String fiscalYearName,
        Long periodId,
        String periodName,
        List<StatementLine> assets,
        List<StatementLine> liabilities,
        List<StatementLine> equity,
        BigDecimal totalAssets,
        BigDecimal totalLiabilitiesAndEquity
) {
    public record StatementLine(String lineCode, String accountCode, String accountName, short level, BigDecimal balance) {}
}
