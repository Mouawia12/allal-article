package com.allalarticle.backend.accounting.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record JournalRequest(
        @NotNull Long journalBookId,
        @NotNull LocalDate journalDate,
        String description,
        String referenceType,
        Long referenceId,
        String referenceNumber,
        @NotEmpty @Valid List<JournalItemRequest> items
) {
    public record JournalItemRequest(
            @NotNull Long accountId,
            @NotNull BigDecimal debit,
            @NotNull BigDecimal credit,
            String description,
            String costCenter
    ) {}
}
