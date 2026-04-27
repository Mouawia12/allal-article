package com.allalarticle.backend.accounting.service;

import com.allalarticle.backend.accounting.dto.FiscalYearRequest;
import com.allalarticle.backend.accounting.dto.FiscalYearResponse;
import com.allalarticle.backend.accounting.entity.AccountingPeriod;
import com.allalarticle.backend.accounting.entity.FiscalYear;
import com.allalarticle.backend.accounting.repository.FiscalYearRepository;
import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FiscalYearService {

    private final FiscalYearRepository fiscalYearRepo;

    @Transactional(readOnly = true)
    public List<FiscalYearResponse> findAll() {
        return fiscalYearRepo.findAllByOrderByStartDateDesc().stream()
                .map(FiscalYearResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public FiscalYearResponse findById(Long id) {
        return FiscalYearResponse.from(getOrThrow(id));
    }

    @Transactional
    public FiscalYearResponse create(FiscalYearRequest req, Long userId) {
        if (fiscalYearRepo.existsByStartDateLessThanEqualAndEndDateGreaterThanEqual(req.endDate(), req.startDate())) {
            throw new AppException(ErrorCode.CONFLICT, "تاريخ السنة المالية يتداخل مع سنة مالية موجودة", HttpStatus.CONFLICT);
        }
        FiscalYear fy = FiscalYear.builder()
                .name(req.name())
                .startDate(req.startDate())
                .endDate(req.endDate())
                .createdById(userId)
                .build();

        generatePeriods(fy);
        return FiscalYearResponse.from(fiscalYearRepo.save(fy));
    }

    @Transactional
    public FiscalYearResponse close(Long id, Long userId) {
        FiscalYear fy = getOrThrow(id);
        if (!"open".equals(fy.getStatus())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "السنة المالية ليست مفتوحة", HttpStatus.BAD_REQUEST);
        }
        fy.setStatus("closed");
        fy.setClosedById(userId);
        fy.setClosedAt(java.time.OffsetDateTime.now());
        return FiscalYearResponse.from(fiscalYearRepo.save(fy));
    }

    private void generatePeriods(FiscalYear fy) {
        List<AccountingPeriod> periods = new ArrayList<>();
        LocalDate cursor = fy.getStartDate();
        short num = 1;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMMM yyyy", java.util.Locale.of("ar"));
        while (!cursor.isAfter(fy.getEndDate())) {
            LocalDate periodEnd = cursor.withDayOfMonth(cursor.lengthOfMonth());
            if (periodEnd.isAfter(fy.getEndDate())) periodEnd = fy.getEndDate();
            AccountingPeriod p = AccountingPeriod.builder()
                    .fiscalYear(fy)
                    .periodNumber(num++)
                    .name(cursor.format(fmt))
                    .startDate(cursor)
                    .endDate(periodEnd)
                    .build();
            periods.add(p);
            cursor = periodEnd.plusDays(1);
        }
        fy.getPeriods().addAll(periods);
    }

    private FiscalYear getOrThrow(Long id) {
        return fiscalYearRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "السنة المالية غير موجودة", HttpStatus.NOT_FOUND));
    }
}
