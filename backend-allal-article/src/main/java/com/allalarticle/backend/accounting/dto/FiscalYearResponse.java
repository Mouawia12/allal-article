package com.allalarticle.backend.accounting.dto;

import com.allalarticle.backend.accounting.entity.FiscalYear;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record FiscalYearResponse(
        Long id,
        UUID publicId,
        String name,
        LocalDate startDate,
        LocalDate endDate,
        String status,
        boolean closed,
        OffsetDateTime closedAt,
        Long closedBy,
        List<PeriodSummary> periods
) {
    public record PeriodSummary(Long id, short periodNumber, String name, LocalDate startDate, LocalDate endDate, String status) {}

    public static FiscalYearResponse from(FiscalYear fy) {
        var periods = fy.getPeriods().stream()
                .map(p -> new PeriodSummary(p.getId(), p.getPeriodNumber(), p.getName(), p.getStartDate(), p.getEndDate(), p.getStatus()))
                .toList();
        return new FiscalYearResponse(
                fy.getId(), fy.getPublicId(), fy.getName(), fy.getStartDate(), fy.getEndDate(),
                fy.getStatus(), "closed".equals(fy.getStatus()), fy.getClosedAt(), fy.getClosedById(), periods);
    }
}
