package com.allalarticle.backend.accounting.dto;

import java.math.BigDecimal;
import java.util.List;

public record IncomeStatementResponse(
        Long fiscalYearId,
        String fiscalYearName,
        Long periodId,
        String periodName,
        List<StatementLine> revenues,
        List<StatementLine> expenses,
        BigDecimal totalRevenue,
        BigDecimal totalExpense,
        BigDecimal netIncome
) {
    public record StatementLine(String lineCode, String accountCode, String accountName, short level, BigDecimal amount) {}
}
