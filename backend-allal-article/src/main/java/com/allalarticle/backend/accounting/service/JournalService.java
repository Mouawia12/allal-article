package com.allalarticle.backend.accounting.service;

import com.allalarticle.backend.accounting.dto.JournalRequest;
import com.allalarticle.backend.accounting.dto.JournalResponse;
import com.allalarticle.backend.accounting.entity.*;
import com.allalarticle.backend.accounting.repository.*;
import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JournalService {

    private final JournalRepository journalRepo;
    private final JournalBookRepository journalBookRepo;
    private final FiscalYearRepository fiscalYearRepo;
    private final AccountingPeriodRepository periodRepo;
    private final AccountRepository accountRepo;
    private final AccountBalanceRepository balanceRepo;
    private final NumberSequenceService numberSeqService;

    @Transactional(readOnly = true)
    public Page<JournalResponse> findByFiscalYear(Long fiscalYearId, Pageable pageable) {
        return journalRepo.findByFiscalYearId(fiscalYearId, pageable).map(JournalResponse::from);
    }

    @Transactional(readOnly = true)
    public JournalResponse findById(Long id) {
        return JournalResponse.from(getOrThrow(id));
    }

    @Transactional
    public JournalResponse create(JournalRequest req, Long userId) {
        JournalBook book = journalBookRepo.findById(req.journalBookId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "دفتر اليومية غير موجود", HttpStatus.NOT_FOUND));

        FiscalYear fy = fiscalYearRepo.findByStatus("open")
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST, "لا توجد سنة مالية مفتوحة", HttpStatus.BAD_REQUEST));

        AccountingPeriod period = periodRepo.findByFiscalYearIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        fy.getId(), req.journalDate(), req.journalDate())
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST, "لا توجد فترة محاسبية مطابقة للتاريخ", HttpStatus.BAD_REQUEST));

        if (!"open".equals(period.getStatus())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "الفترة المحاسبية مغلقة", HttpStatus.BAD_REQUEST);
        }

        validateBalance(req.items());

        Journal journal = Journal.builder()
                .journalNumber("TEMP")
                .journalBook(book)
                .fiscalYear(fy)
                .period(period)
                .journalDate(req.journalDate())
                .description(req.description() != null ? req.description() : "")
                .referenceType(req.referenceType())
                .referenceId(req.referenceId())
                .referenceNumber(req.referenceNumber())
                .createdById(userId)
                .build();

        List<JournalItem> items = buildItems(journal, req.items());
        journal.getItems().addAll(items);
        journal.setTotalDebit(items.stream().map(JournalItem::getDebit).reduce(BigDecimal.ZERO, BigDecimal::add));
        journal.setTotalCredit(items.stream().map(JournalItem::getCredit).reduce(BigDecimal.ZERO, BigDecimal::add));

        Journal saved = journalRepo.save(journal);
        String seqKey = book.getCode() + "." + fy.getStartDate().getYear();
        saved.setJournalNumber(numberSeqService.next(seqKey));
        return JournalResponse.from(journalRepo.save(saved));
    }

    @Transactional
    public JournalResponse post(Long id, Long userId) {
        Journal journal = getOrThrow(id);
        if (!"draft".equals(journal.getStatus())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "القيد غير في حالة مسودة", HttpStatus.BAD_REQUEST);
        }
        journal.setStatus("posted");
        journal.setPostedById(userId);
        journal.setPostedAt(OffsetDateTime.now());

        updateBalances(journal);
        return JournalResponse.from(journalRepo.save(journal));
    }

    @Transactional
    public void delete(Long id) {
        Journal journal = getOrThrow(id);
        if ("posted".equals(journal.getStatus())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "لا يمكن حذف قيد مرحّل", HttpStatus.BAD_REQUEST);
        }
        journalRepo.delete(journal);
    }

    private void updateBalances(Journal journal) {
        for (JournalItem item : journal.getItems()) {
            AccountBalance balance = balanceRepo
                    .findByAccountIdAndPeriodId(item.getAccount().getId(), journal.getPeriod().getId())
                    .orElseGet(() -> AccountBalance.builder()
                            .account(item.getAccount())
                            .fiscalYear(journal.getFiscalYear())
                            .period(journal.getPeriod())
                            .build());

            balance.setPeriodDebit(balance.getPeriodDebit().add(item.getDebit()));
            balance.setPeriodCredit(balance.getPeriodCredit().add(item.getCredit()));
            balance.setClosingDebit(balance.getOpeningDebit().add(balance.getPeriodDebit()));
            balance.setClosingCredit(balance.getOpeningCredit().add(balance.getPeriodCredit()));
            balanceRepo.save(balance);
        }
    }

    private void validateBalance(List<JournalRequest.JournalItemRequest> items) {
        BigDecimal totalDebit = items.stream().map(JournalRequest.JournalItemRequest::debit).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCredit = items.stream().map(JournalRequest.JournalItemRequest::credit).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new AppException(ErrorCode.BAD_REQUEST, "مجموع المدين لا يساوي مجموع الدائن", HttpStatus.BAD_REQUEST);
        }
    }

    private List<JournalItem> buildItems(Journal journal, List<JournalRequest.JournalItemRequest> itemReqs) {
        List<JournalItem> items = new ArrayList<>();
        int line = 1;
        for (JournalRequest.JournalItemRequest ir : itemReqs) {
            Account account = accountRepo.findById(ir.accountId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "الحساب غير موجود: " + ir.accountId(), HttpStatus.NOT_FOUND));
            items.add(JournalItem.builder()
                    .journal(journal)
                    .account(account)
                    .lineNumber(line++)
                    .debit(ir.debit())
                    .credit(ir.credit())
                    .description(ir.description())
                    .costCenter(ir.costCenter())
                    .build());
        }
        return items;
    }

    Journal getOrThrow(Long id) {
        return journalRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "القيد المحاسبي غير موجود", HttpStatus.NOT_FOUND));
    }
}
