package com.allalarticle.backend.accounting.repository;

import com.allalarticle.backend.accounting.entity.JournalItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface JournalItemRepository extends JpaRepository<JournalItem, Long> {
    List<JournalItem> findByJournalIdOrderByLineNumber(Long journalId);

    @Query("SELECT ji FROM JournalItem ji WHERE ji.account.id = :accountId AND ji.journal.period.id = :periodId AND ji.journal.status = 'posted'")
    List<JournalItem> findPostedByAccountAndPeriod(Long accountId, Long periodId);

    @Query("SELECT ji FROM JournalItem ji WHERE ji.journal.fiscalYear.id = :fyId AND ji.account.id = :accountId AND ji.journal.status = 'posted' ORDER BY ji.journal.journalDate, ji.journal.id")
    List<JournalItem> findPostedByFiscalYearAndAccount(Long fyId, Long accountId);
}
