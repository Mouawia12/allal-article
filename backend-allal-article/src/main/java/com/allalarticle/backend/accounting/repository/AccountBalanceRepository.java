package com.allalarticle.backend.accounting.repository;

import com.allalarticle.backend.accounting.entity.AccountBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface AccountBalanceRepository extends JpaRepository<AccountBalance, Long> {
    Optional<AccountBalance> findByAccountIdAndPeriodId(Long accountId, Long periodId);

    List<AccountBalance> findByFiscalYearId(Long fiscalYearId);

    List<AccountBalance> findByPeriodId(Long periodId);

    @Query("SELECT ab FROM AccountBalance ab WHERE ab.fiscalYear.id = :fyId AND ab.period.id = :periodId AND (ab.closingDebit != 0 OR ab.closingCredit != 0)")
    List<AccountBalance> findNonZeroByFiscalYearAndPeriod(Long fyId, Long periodId);
}
