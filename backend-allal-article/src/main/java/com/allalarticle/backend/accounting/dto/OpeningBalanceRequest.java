package com.allalarticle.backend.accounting.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record OpeningBalanceRequest(
        @NotNull Long fiscalYearId,
        @NotNull List<BalanceLine> lines
) {
    public record BalanceLine(
            @NotNull Long accountId,
            @NotNull BigDecimal debitBalance,
            @NotNull BigDecimal creditBalance
    ) {}
}
