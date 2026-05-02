package com.allalarticle.backend.accounting.service;

import com.allalarticle.backend.accounting.dto.*;
import com.allalarticle.backend.accounting.entity.*;
import com.allalarticle.backend.accounting.repository.*;
import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AccountBalanceService {

    private final AccountBalanceRepository balanceRepo;
    private final FiscalYearRepository fiscalYearRepo;
    private final AccountingPeriodRepository periodRepo;
    private final AccountRepository accountRepo;
    private final OpeningBalanceRepository openingBalanceRepo;
    private final JournalItemRepository journalItemRepo;

    @Transactional(readOnly = true)
    public TrialBalanceResponse trialBalance(Long fiscalYearId, Long periodId) {
        FiscalYear fy = getFiscalYear(fiscalYearId);
        AccountingPeriod period = resolvePeriod(fy, periodId);
        Map<Long, BalanceSnapshot> snapshots = buildSnapshots(fy, period);

        List<TrialBalanceRow> rows = accountRepo.findByDeletedAtIsNullOrderBySortOrder().stream()
                .map(account -> {
                    BalanceSnapshot snapshot = snapshots.getOrDefault(account.getId(), new BalanceSnapshot());
                    return new TrialBalanceRow(
                            account.getId(), account.getCode(), account.getNameAr(), account.getClassification(),
                            account.getLevel(),
                            snapshot.openingDebit, snapshot.openingCredit,
                            snapshot.periodDebit, snapshot.periodCredit,
                            snapshot.closingDebit(), snapshot.closingCredit()
                    );
                })
                .sorted(Comparator.comparing(TrialBalanceRow::accountCode))
                .toList();

        BigDecimal tod = sum(rows, r -> r.openingDebit());
        BigDecimal toc = sum(rows, r -> r.openingCredit());
        BigDecimal tpd = sum(rows, r -> r.periodDebit());
        BigDecimal tpc = sum(rows, r -> r.periodCredit());
        BigDecimal tcd = sum(rows, r -> r.closingDebit());
        BigDecimal tcc = sum(rows, r -> r.closingCredit());

        return new TrialBalanceResponse(fiscalYearId, fy.getName(), period.getId(), period.getName(), rows, tod, toc, tpd, tpc, tcd, tcc);
    }

    @Transactional(readOnly = true)
    public BalanceSheetResponse balanceSheet(Long fiscalYearId, Long periodId) {
        FiscalYear fy = getFiscalYear(fiscalYearId);
        AccountingPeriod period = resolvePeriod(fy, periodId);
        Map<Long, BalanceSnapshot> snapshots = buildSnapshots(fy, period);
        List<BalanceSheetResponse.StatementLine> assets = new ArrayList<>();
        List<BalanceSheetResponse.StatementLine> liabilities = new ArrayList<>();
        List<BalanceSheetResponse.StatementLine> equity = new ArrayList<>();

        for (Account a : accountRepo.findByDeletedAtIsNullOrderBySortOrder()) {
            if (!"balance_sheet".equals(a.getFinancialStatement())) continue;
            BalanceSnapshot snapshot = snapshots.getOrDefault(a.getId(), new BalanceSnapshot());
            BigDecimal balance = normalSideAmount(a, snapshot.closingDebit(), snapshot.closingCredit());
            if (balance.compareTo(BigDecimal.ZERO) == 0) continue;
            BalanceSheetResponse.StatementLine line = new BalanceSheetResponse.StatementLine(
                    a.getStatementLineCode(), a.getCode(), a.getNameAr(), a.getLevel(), balance);
            switch (a.getClassification()) {
                case "asset" -> assets.add(line);
                case "liability" -> liabilities.add(line);
                case "equity" -> equity.add(line);
            }
        }

        BigDecimal totalAssets = assets.stream().map(BalanceSheetResponse.StatementLine::balance).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalLE = liabilities.stream().map(BalanceSheetResponse.StatementLine::balance).reduce(BigDecimal.ZERO, BigDecimal::add)
                .add(equity.stream().map(BalanceSheetResponse.StatementLine::balance).reduce(BigDecimal.ZERO, BigDecimal::add));

        return new BalanceSheetResponse(fiscalYearId, fy.getName(), period.getId(), period.getName(), assets, liabilities, equity, totalAssets, totalLE);
    }

    @Transactional(readOnly = true)
    public IncomeStatementResponse incomeStatement(Long fiscalYearId, Long periodId) {
        FiscalYear fy = getFiscalYear(fiscalYearId);
        AccountingPeriod period = resolvePeriod(fy, periodId);
        Map<Long, BalanceSnapshot> snapshots = buildSnapshots(fy, period);
        List<IncomeStatementResponse.StatementLine> revenues = new ArrayList<>();
        List<IncomeStatementResponse.StatementLine> expenses = new ArrayList<>();

        for (Account a : accountRepo.findByDeletedAtIsNullOrderBySortOrder()) {
            if (!"income_statement".equals(a.getFinancialStatement())) continue;
            BalanceSnapshot snapshot = snapshots.getOrDefault(a.getId(), new BalanceSnapshot());
            BigDecimal amount = normalSideAmount(a, snapshot.periodDebit, snapshot.periodCredit);
            if (amount.compareTo(BigDecimal.ZERO) == 0) continue;
            IncomeStatementResponse.StatementLine line = new IncomeStatementResponse.StatementLine(
                    a.getStatementLineCode(), a.getCode(), a.getNameAr(), a.getLevel(), amount);
            if ("revenue".equals(a.getClassification())) revenues.add(line);
            else if ("expense".equals(a.getClassification())) expenses.add(line);
        }

        BigDecimal totalRev = revenues.stream().map(IncomeStatementResponse.StatementLine::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalExp = expenses.stream().map(IncomeStatementResponse.StatementLine::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new IncomeStatementResponse(fiscalYearId, fy.getName(), period.getId(), period.getName(), revenues, expenses, totalRev, totalExp, totalRev.subtract(totalExp));
    }

    @Transactional(readOnly = true)
    public GeneralLedgerResponse generalLedger(Long accountId, Long fiscalYearId) {
        Account account = accountRepo.findById(accountId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "الحساب غير موجود", HttpStatus.NOT_FOUND));

        OpeningBalance ob = openingBalanceRepo.findByAccountIdAndFiscalYearId(accountId, fiscalYearId).orElse(null);
        BigDecimal openingBal = BigDecimal.ZERO;
        if (ob != null) {
            openingBal = "debit".equals(account.getNormalBalance())
                    ? ob.getDebitBalance().subtract(ob.getCreditBalance())
                    : ob.getCreditBalance().subtract(ob.getDebitBalance());
        }

        List<JournalItem> items = journalItemRepo.findPostedByFiscalYearAndAccount(fiscalYearId, accountId);
        List<GeneralLedgerResponse.LedgerLine> lines = new ArrayList<>();
        BigDecimal running = openingBal;
        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;

        for (JournalItem item : items) {
            if ("debit".equals(account.getNormalBalance())) {
                running = running.add(item.getDebit()).subtract(item.getCredit());
            } else {
                running = running.add(item.getCredit()).subtract(item.getDebit());
            }
            totalDebit = totalDebit.add(item.getDebit());
            totalCredit = totalCredit.add(item.getCredit());
            lines.add(new GeneralLedgerResponse.LedgerLine(
                    item.getJournal().getJournalDate(),
                    item.getJournal().getJournalNumber(),
                    item.getDescription(),
                    item.getJournal().getReferenceNumber(),
                    item.getDebit(), item.getCredit(), running
            ));
        }
        return new GeneralLedgerResponse(accountId, account.getCode(), account.getNameAr(), openingBal, lines, totalDebit, totalCredit, running);
    }

    @Transactional
    public void saveOpeningBalances(OpeningBalanceRequest req, Long userId) {
        FiscalYear fy = getFiscalYear(req.fiscalYearId());
        AccountingPeriod firstPeriod = periodRepo.findByFiscalYearIdOrderByPeriodNumber(req.fiscalYearId()).stream()
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST, "لا توجد فترات محاسبية لهذه السنة", HttpStatus.BAD_REQUEST));

        for (OpeningBalanceRequest.BalanceLine line : req.lines()) {
            Account account = accountRepo.findById(line.accountId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "الحساب غير موجود", HttpStatus.NOT_FOUND));

            OpeningBalance ob = openingBalanceRepo.findByAccountIdAndFiscalYearId(line.accountId(), req.fiscalYearId())
                    .orElseGet(() -> OpeningBalance.builder().account(account).fiscalYear(fy).createdById(userId).build());
            ob.setDebitBalance(line.debitBalance());
            ob.setCreditBalance(line.creditBalance());
            openingBalanceRepo.save(ob);

            AccountBalance balance = balanceRepo.findByAccountIdAndPeriodId(line.accountId(), firstPeriod.getId())
                    .orElseGet(() -> AccountBalance.builder()
                            .account(account)
                            .fiscalYear(fy)
                            .period(firstPeriod)
                            .build());
            balance.setOpeningDebit(nullToZero(line.debitBalance()));
            balance.setOpeningCredit(nullToZero(line.creditBalance()));
            balance.setClosingDebit(balance.getOpeningDebit().add(nullToZero(balance.getPeriodDebit())));
            balance.setClosingCredit(balance.getOpeningCredit().add(nullToZero(balance.getPeriodCredit())));
            balanceRepo.save(balance);
        }
    }

    private FiscalYear getFiscalYear(Long fiscalYearId) {
        return fiscalYearRepo.findById(fiscalYearId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "السنة المالية غير موجودة", HttpStatus.NOT_FOUND));
    }

    private AccountingPeriod resolvePeriod(FiscalYear fy, Long periodId) {
        if (periodId != null) {
            AccountingPeriod period = periodRepo.findById(periodId)
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "الفترة المحاسبية غير موجودة", HttpStatus.NOT_FOUND));
            if (!period.getFiscalYear().getId().equals(fy.getId())) {
                throw new AppException(ErrorCode.BAD_REQUEST, "الفترة لا تنتمي للسنة المالية المحددة", HttpStatus.BAD_REQUEST);
            }
            return period;
        }

        LocalDate today = LocalDate.now();
        if (!today.isBefore(fy.getStartDate()) && !today.isAfter(fy.getEndDate())) {
            Optional<AccountingPeriod> current = periodRepo.findByFiscalYearIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                    fy.getId(), today, today);
            if (current.isPresent()) return current.get();
        }

        return periodRepo.findFirstByFiscalYearIdAndStatusOrderByPeriodNumberDesc(fy.getId(), "open")
                .or(() -> periodRepo.findFirstByFiscalYearIdOrderByPeriodNumberDesc(fy.getId()))
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST, "لا توجد فترات محاسبية لهذه السنة", HttpStatus.BAD_REQUEST));
    }

    private Map<Long, BalanceSnapshot> buildSnapshots(FiscalYear fy, AccountingPeriod targetPeriod) {
        Map<Long, BalanceSnapshot> snapshots = new HashMap<>();

        for (OpeningBalance opening : openingBalanceRepo.findByFiscalYearId(fy.getId())) {
            BalanceSnapshot snapshot = snapshots.computeIfAbsent(opening.getAccount().getId(), id -> new BalanceSnapshot());
            snapshot.openingDebit = nullToZero(opening.getDebitBalance());
            snapshot.openingCredit = nullToZero(opening.getCreditBalance());
        }

        for (AccountBalance balance : balanceRepo.findByFiscalYearId(fy.getId())) {
            AccountingPeriod period = balance.getPeriod();
            if (period == null || period.getPeriodNumber() > targetPeriod.getPeriodNumber()) continue;
            BalanceSnapshot snapshot = snapshots.computeIfAbsent(balance.getAccount().getId(), id -> new BalanceSnapshot());
            if (period.getPeriodNumber() == 1 && snapshot.hasNoOpening()) {
                snapshot.openingDebit = nullToZero(balance.getOpeningDebit());
                snapshot.openingCredit = nullToZero(balance.getOpeningCredit());
            }
            snapshot.periodDebit = snapshot.periodDebit.add(nullToZero(balance.getPeriodDebit()));
            snapshot.periodCredit = snapshot.periodCredit.add(nullToZero(balance.getPeriodCredit()));
        }

        return snapshots;
    }

    private BigDecimal normalSideAmount(Account account, BigDecimal debit, BigDecimal credit) {
        if ("credit".equals(account.getNormalBalance())) {
            return credit.subtract(debit);
        }
        return debit.subtract(credit);
    }

    private BigDecimal nullToZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private <T> BigDecimal sum(List<T> list, java.util.function.Function<T, BigDecimal> extractor) {
        return list.stream().map(extractor).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static class BalanceSnapshot {
        private BigDecimal openingDebit = BigDecimal.ZERO;
        private BigDecimal openingCredit = BigDecimal.ZERO;
        private BigDecimal periodDebit = BigDecimal.ZERO;
        private BigDecimal periodCredit = BigDecimal.ZERO;

        private BigDecimal closingDebit() {
            return openingDebit.add(periodDebit);
        }

        private BigDecimal closingCredit() {
            return openingCredit.add(periodCredit);
        }

        private boolean hasNoOpening() {
            return openingDebit.compareTo(BigDecimal.ZERO) == 0 && openingCredit.compareTo(BigDecimal.ZERO) == 0;
        }
    }
}
