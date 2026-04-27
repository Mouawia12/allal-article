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
        FiscalYear fy = fiscalYearRepo.findById(fiscalYearId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "السنة المالية غير موجودة", HttpStatus.NOT_FOUND));
        AccountingPeriod period = periodRepo.findById(periodId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "الفترة المحاسبية غير موجودة", HttpStatus.NOT_FOUND));

        List<AccountBalance> balances = balanceRepo.findByPeriodId(periodId);
        List<TrialBalanceRow> rows = balances.stream()
                .map(b -> new TrialBalanceRow(
                        b.getAccount().getCode(), b.getAccount().getNameAr(), b.getAccount().getClassification(),
                        b.getAccount().getLevel(),
                        b.getOpeningDebit(), b.getOpeningCredit(),
                        b.getPeriodDebit(), b.getPeriodCredit(),
                        b.getClosingDebit(), b.getClosingCredit()
                ))
                .sorted(Comparator.comparing(TrialBalanceRow::accountCode))
                .toList();

        BigDecimal tod = sum(rows, r -> r.openingDebit());
        BigDecimal toc = sum(rows, r -> r.openingCredit());
        BigDecimal tpd = sum(rows, r -> r.periodDebit());
        BigDecimal tpc = sum(rows, r -> r.periodCredit());
        BigDecimal tcd = sum(rows, r -> r.closingDebit());
        BigDecimal tcc = sum(rows, r -> r.closingCredit());

        return new TrialBalanceResponse(fiscalYearId, fy.getName(), periodId, period.getName(), rows, tod, toc, tpd, tpc, tcd, tcc);
    }

    @Transactional(readOnly = true)
    public BalanceSheetResponse balanceSheet(Long fiscalYearId, Long periodId) {
        FiscalYear fy = fiscalYearRepo.findById(fiscalYearId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "السنة المالية غير موجودة", HttpStatus.NOT_FOUND));
        AccountingPeriod period = periodRepo.findById(periodId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "الفترة المحاسبية غير موجودة", HttpStatus.NOT_FOUND));

        List<AccountBalance> balances = balanceRepo.findNonZeroByFiscalYearAndPeriod(fiscalYearId, periodId);
        List<BalanceSheetResponse.StatementLine> assets = new ArrayList<>();
        List<BalanceSheetResponse.StatementLine> liabilities = new ArrayList<>();
        List<BalanceSheetResponse.StatementLine> equity = new ArrayList<>();

        for (AccountBalance b : balances) {
            Account a = b.getAccount();
            if (!"balance_sheet".equals(a.getFinancialStatement())) continue;
            BigDecimal balance = b.getClosingDebit().subtract(b.getClosingCredit());
            BalanceSheetResponse.StatementLine line = new BalanceSheetResponse.StatementLine(
                    a.getStatementLineCode(), a.getCode(), a.getNameAr(), a.getLevel(), balance.abs());
            switch (a.getClassification()) {
                case "asset" -> assets.add(line);
                case "liability" -> liabilities.add(line);
                case "equity" -> equity.add(line);
            }
        }

        BigDecimal totalAssets = assets.stream().map(BalanceSheetResponse.StatementLine::balance).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalLE = liabilities.stream().map(BalanceSheetResponse.StatementLine::balance).reduce(BigDecimal.ZERO, BigDecimal::add)
                .add(equity.stream().map(BalanceSheetResponse.StatementLine::balance).reduce(BigDecimal.ZERO, BigDecimal::add));

        return new BalanceSheetResponse(fiscalYearId, fy.getName(), periodId, period.getName(), assets, liabilities, equity, totalAssets, totalLE);
    }

    @Transactional(readOnly = true)
    public IncomeStatementResponse incomeStatement(Long fiscalYearId, Long periodId) {
        FiscalYear fy = fiscalYearRepo.findById(fiscalYearId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "السنة المالية غير موجودة", HttpStatus.NOT_FOUND));
        AccountingPeriod period = periodRepo.findById(periodId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "الفترة المحاسبية غير موجودة", HttpStatus.NOT_FOUND));

        List<AccountBalance> balances = balanceRepo.findNonZeroByFiscalYearAndPeriod(fiscalYearId, periodId);
        List<IncomeStatementResponse.StatementLine> revenues = new ArrayList<>();
        List<IncomeStatementResponse.StatementLine> expenses = new ArrayList<>();

        for (AccountBalance b : balances) {
            Account a = b.getAccount();
            if (!"income_statement".equals(a.getFinancialStatement())) continue;
            BigDecimal amount = b.getPeriodCredit().subtract(b.getPeriodDebit()).abs();
            IncomeStatementResponse.StatementLine line = new IncomeStatementResponse.StatementLine(
                    a.getStatementLineCode(), a.getCode(), a.getNameAr(), a.getLevel(), amount);
            if ("revenue".equals(a.getClassification())) revenues.add(line);
            else if ("expense".equals(a.getClassification())) expenses.add(line);
        }

        BigDecimal totalRev = revenues.stream().map(IncomeStatementResponse.StatementLine::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalExp = expenses.stream().map(IncomeStatementResponse.StatementLine::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new IncomeStatementResponse(fiscalYearId, fy.getName(), periodId, period.getName(), revenues, expenses, totalRev, totalExp, totalRev.subtract(totalExp));
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
        for (OpeningBalanceRequest.BalanceLine line : req.lines()) {
            Account account = accountRepo.findById(line.accountId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "الحساب غير موجود", HttpStatus.NOT_FOUND));
            FiscalYear fy = fiscalYearRepo.findById(req.fiscalYearId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "السنة المالية غير موجودة", HttpStatus.NOT_FOUND));

            OpeningBalance ob = openingBalanceRepo.findByAccountIdAndFiscalYearId(line.accountId(), req.fiscalYearId())
                    .orElseGet(() -> OpeningBalance.builder().account(account).fiscalYear(fy).createdById(userId).build());
            ob.setDebitBalance(line.debitBalance());
            ob.setCreditBalance(line.creditBalance());
            openingBalanceRepo.save(ob);
        }
    }

    private <T> BigDecimal sum(List<T> list, java.util.function.Function<T, BigDecimal> extractor) {
        return list.stream().map(extractor).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
