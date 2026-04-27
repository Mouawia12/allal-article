package com.allalarticle.backend.accounting.repository;

import com.allalarticle.backend.accounting.entity.OpeningBalance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OpeningBalanceRepository extends JpaRepository<OpeningBalance, Long> {
    Optional<OpeningBalance> findByAccountIdAndFiscalYearId(Long accountId, Long fiscalYearId);
    List<OpeningBalance> findByFiscalYearId(Long fiscalYearId);
}
