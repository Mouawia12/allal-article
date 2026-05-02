package com.allalarticle.backend.accounting;

import com.allalarticle.backend.accounting.dto.OpeningBalanceRequest;
import com.allalarticle.backend.accounting.dto.TrialBalanceResponse;
import com.allalarticle.backend.accounting.entity.*;
import com.allalarticle.backend.accounting.repository.*;
import com.allalarticle.backend.accounting.service.AccountBalanceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountBalanceServiceTest {

    @Mock AccountBalanceRepository balanceRepo;
    @Mock FiscalYearRepository fiscalYearRepo;
    @Mock AccountingPeriodRepository periodRepo;
    @Mock AccountRepository accountRepo;
    @Mock OpeningBalanceRepository openingBalanceRepo;
    @Mock JournalItemRepository journalItemRepo;

    private AccountBalanceService service;

    @BeforeEach
    void setUp() {
        service = new AccountBalanceService(balanceRepo, fiscalYearRepo, periodRepo, accountRepo, openingBalanceRepo, journalItemRepo);
    }

    @Test
    void trialBalance_whenPeriodOmitted_usesCurrentPeriodAndIncludesOpeningAndMovementsToDate() {
        FiscalYear fy = fiscalYear();
        AccountingPeriod may = period(5, (short) 5, fy);
        Account cash = account(10L, "1301", "الصندوق", "asset", "debit", "balance_sheet");
        OpeningBalance opening = OpeningBalance.builder()
                .account(cash).fiscalYear(fy).debitBalance(new BigDecimal("100.00")).creditBalance(BigDecimal.ZERO).build();
        AccountBalance movement = AccountBalance.builder()
                .account(cash).fiscalYear(fy).period(may)
                .periodDebit(new BigDecimal("25.00")).periodCredit(new BigDecimal("5.00"))
                .build();

        when(fiscalYearRepo.findById(1L)).thenReturn(Optional.of(fy));
        when(periodRepo.findByFiscalYearIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(eq(1L), any(), any()))
                .thenReturn(Optional.of(may));
        when(openingBalanceRepo.findByFiscalYearId(1L)).thenReturn(List.of(opening));
        when(balanceRepo.findByFiscalYearId(1L)).thenReturn(List.of(movement));
        when(accountRepo.findByDeletedAtIsNullOrderBySortOrder()).thenReturn(List.of(cash));

        TrialBalanceResponse response = service.trialBalance(1L, null);

        assertThat(response.periodId()).isEqualTo(5L);
        assertThat(response.rows()).hasSize(1);
        var row = response.rows().getFirst();
        assertThat(row.accountId()).isEqualTo(10L);
        assertThat(row.openingDebit()).isEqualByComparingTo("100.00");
        assertThat(row.periodDebit()).isEqualByComparingTo("25.00");
        assertThat(row.periodCredit()).isEqualByComparingTo("5.00");
        assertThat(row.closingDebit()).isEqualByComparingTo("125.00");
        assertThat(row.closingCredit()).isEqualByComparingTo("5.00");
    }

    @Test
    void saveOpeningBalances_syncsFirstPeriodAccountBalanceSoReportsSeeOpeningAmounts() {
        FiscalYear fy = fiscalYear();
        AccountingPeriod january = period(1, (short) 1, fy);
        Account cash = account(10L, "1301", "الصندوق", "asset", "debit", "balance_sheet");
        OpeningBalanceRequest request = new OpeningBalanceRequest(1L, List.of(
                new OpeningBalanceRequest.BalanceLine(10L, new BigDecimal("250.00"), BigDecimal.ZERO)
        ));

        when(fiscalYearRepo.findById(1L)).thenReturn(Optional.of(fy));
        when(periodRepo.findByFiscalYearIdOrderByPeriodNumber(1L)).thenReturn(List.of(january));
        when(accountRepo.findById(10L)).thenReturn(Optional.of(cash));
        when(openingBalanceRepo.findByAccountIdAndFiscalYearId(10L, 1L)).thenReturn(Optional.empty());
        when(balanceRepo.findByAccountIdAndPeriodId(10L, 1L)).thenReturn(Optional.empty());

        service.saveOpeningBalances(request, 7L);

        ArgumentCaptor<OpeningBalance> openingCaptor = ArgumentCaptor.forClass(OpeningBalance.class);
        ArgumentCaptor<AccountBalance> balanceCaptor = ArgumentCaptor.forClass(AccountBalance.class);
        verify(openingBalanceRepo).save(openingCaptor.capture());
        verify(balanceRepo).save(balanceCaptor.capture());

        assertThat(openingCaptor.getValue().getDebitBalance()).isEqualByComparingTo("250.00");
        assertThat(openingCaptor.getValue().getCreatedById()).isEqualTo(7L);
        assertThat(balanceCaptor.getValue().getOpeningDebit()).isEqualByComparingTo("250.00");
        assertThat(balanceCaptor.getValue().getClosingDebit()).isEqualByComparingTo("250.00");
    }

    private FiscalYear fiscalYear() {
        return FiscalYear.builder()
                .id(1L)
                .name("السنة المالية 2026")
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 12, 31))
                .build();
    }

    private AccountingPeriod period(long id, short number, FiscalYear fy) {
        return AccountingPeriod.builder()
                .id(id)
                .fiscalYear(fy)
                .periodNumber(number)
                .name("الفترة " + number)
                .startDate(LocalDate.of(2026, number, 1))
                .endDate(LocalDate.of(2026, number, 1).withDayOfMonth(LocalDate.of(2026, number, 1).lengthOfMonth()))
                .status("open")
                .build();
    }

    private Account account(Long id, String code, String name, String classification, String normalBalance, String statement) {
        return Account.builder()
                .id(id)
                .code(code)
                .nameAr(name)
                .classification(classification)
                .normalBalance(normalBalance)
                .financialStatement(statement)
                .level((short) 3)
                .postable(true)
                .status("active")
                .build();
    }
}
