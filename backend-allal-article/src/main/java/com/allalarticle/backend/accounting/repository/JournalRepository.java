package com.allalarticle.backend.accounting.repository;

import com.allalarticle.backend.accounting.entity.Journal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface JournalRepository extends JpaRepository<Journal, Long> {
    Optional<Journal> findByJournalNumber(String journalNumber);

    Page<Journal> findByFiscalYearId(Long fiscalYearId, Pageable pageable);

    Page<Journal> findByPeriodId(Long periodId, Pageable pageable);

    List<Journal> findByStatusAndPeriodId(String status, Long periodId);

    @Query("SELECT j FROM Journal j WHERE j.referenceType = :refType AND j.referenceId = :refId")
    List<Journal> findByReference(String refType, Long refId);

    @Query("SELECT j FROM Journal j WHERE j.fiscalYear.id = :fyId AND j.journalDate BETWEEN :from AND :to ORDER BY j.journalDate, j.id")
    List<Journal> findByFiscalYearAndDateRange(Long fyId, LocalDate from, LocalDate to);
}
