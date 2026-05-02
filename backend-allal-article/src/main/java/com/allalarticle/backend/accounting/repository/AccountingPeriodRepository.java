package com.allalarticle.backend.accounting.repository;

import com.allalarticle.backend.accounting.entity.AccountingPeriod;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AccountingPeriodRepository extends JpaRepository<AccountingPeriod, Long> {
    List<AccountingPeriod> findByFiscalYearIdOrderByPeriodNumber(Long fiscalYearId);
    Optional<AccountingPeriod> findFirstByFiscalYearIdAndStatusOrderByPeriodNumberDesc(Long fiscalYearId, String status);
    Optional<AccountingPeriod> findFirstByFiscalYearIdOrderByPeriodNumberDesc(Long fiscalYearId);
    Optional<AccountingPeriod> findByFiscalYearIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Long fiscalYearId, LocalDate date1, LocalDate date2);
}
