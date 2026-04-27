package com.allalarticle.backend.accounting.dto;

import java.math.BigDecimal;

public record TrialBalanceRow(
        String accountCode,
        String accountName,
        String classification,
        short level,
        BigDecimal openingDebit,
        BigDecimal openingCredit,
        BigDecimal periodDebit,
        BigDecimal periodCredit,
        BigDecimal closingDebit,
        BigDecimal closingCredit
) {}
