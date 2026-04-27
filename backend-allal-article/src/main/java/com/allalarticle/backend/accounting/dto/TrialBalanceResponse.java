package com.allalarticle.backend.accounting.dto;

import java.math.BigDecimal;
import java.util.List;

public record TrialBalanceResponse(
        Long fiscalYearId,
        String fiscalYearName,
        Long periodId,
        String periodName,
        List<TrialBalanceRow> rows,
        BigDecimal totalOpeningDebit,
        BigDecimal totalOpeningCredit,
        BigDecimal totalPeriodDebit,
        BigDecimal totalPeriodCredit,
        BigDecimal totalClosingDebit,
        BigDecimal totalClosingCredit
) {}
