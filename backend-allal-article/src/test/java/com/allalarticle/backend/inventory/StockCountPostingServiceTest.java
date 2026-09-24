package com.allalarticle.backend.inventory;

import com.allalarticle.backend.accounting.dto.JournalRequest;
import com.allalarticle.backend.accounting.dto.JournalResponse;
import com.allalarticle.backend.accounting.entity.Account;
import com.allalarticle.backend.accounting.entity.AccountingSettings;
import com.allalarticle.backend.accounting.entity.JournalBook;
import com.allalarticle.backend.accounting.repository.AccountingSettingsRepository;
import com.allalarticle.backend.accounting.repository.JournalBookRepository;
import com.allalarticle.backend.accounting.service.JournalService;
import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.inventory.entity.StockCount;
import com.allalarticle.backend.inventory.entity.StockCountItem;
import com.allalarticle.backend.inventory.entity.Warehouse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class StockCountPostingServiceTest {

    /** The code seeded by T20 for «دفتر المخزون» — "INV" is only its numbering prefix. */
    private static final String INVENTORY_BOOK_CODE = "inventory";
    private static final long INVENTORY_ACCOUNT = 1101L;
    private static final long VARIANCE_ACCOUNT = 5006L;

    @Mock JournalService journalService;
    @Mock JournalBookRepository bookRepo;
    @Mock AccountingSettingsRepository settingsRepo;

    @InjectMocks StockCountPostingService service;

    private StockCount count;

    @BeforeEach
    void setUp() {
        count = StockCount.builder()
                .id(5L).reference("INV-2026-00001")
                .warehouse(Warehouse.builder().id(1L).name("المستودع الرئيسي").build())
                .build();

        when(bookRepo.findByCode(INVENTORY_BOOK_CODE))
                .thenReturn(Optional.of(JournalBook.builder().id(9L).code(INVENTORY_BOOK_CODE).build()));
        when(settingsRepo.findByKey("inventory")).thenReturn(Optional.of(setting(INVENTORY_ACCOUNT)));
        when(settingsRepo.findByKey("inventory_variance")).thenReturn(Optional.of(setting(VARIANCE_ACCOUNT)));
        // Built before the stubbing below: mocking inside an open when(...) confuses Mockito.
        JournalResponse created = journalResponse(77L, "INV-2026-000004");
        JournalResponse posted = journalResponse(77L, "INV-2026-000004");
        when(journalService.create(any(), any())).thenReturn(created);
        when(journalService.post(anyLong(), any())).thenReturn(posted);
    }

    private AccountingSettings setting(long accountId) {
        var s = new AccountingSettings();
        var account = new Account();
        account.setId(accountId);
        s.setAccount(account);
        return s;
    }

    private JournalResponse journalResponse(Long id, String number) {
        var response = mock(JournalResponse.class);
        when(response.id()).thenReturn(id);
        when(response.journalNumber()).thenReturn(number);
        return response;
    }

    private StockCountItem line(String systemQty, String countedQty, String cost) {
        return StockCountItem.builder()
                .systemQty(new BigDecimal(systemQty))
                .countedQty(countedQty == null ? null : new BigDecimal(countedQty))
                .unitCost(cost == null ? null : new BigDecimal(cost))
                .build();
    }

    private JournalRequest captureRequest() {
        var captor = ArgumentCaptor.forClass(JournalRequest.class);
        verify(journalService).create(captor.capture(), any());
        return captor.getValue();
    }

    @Test
    void aShortfallChargesTheVarianceExpenseAndReleasesInventory() {
        // 100 expected, 88 found, at 50 → 600 of stock is gone.
        service.post(count, List.of(line("100", "88", "50")), 3L);

        var request = captureRequest();
        assertThat(request.items()).hasSize(2);
        var expense = request.items().get(0);
        var inventory = request.items().get(1);

        assertThat(expense.accountId()).isEqualTo(VARIANCE_ACCOUNT);
        assertThat(expense.debit()).isEqualByComparingTo("600");
        assertThat(inventory.accountId()).isEqualTo(INVENTORY_ACCOUNT);
        assertThat(inventory.credit()).isEqualByComparingTo("600");
    }

    @Test
    void aSurplusIsTheMirrorImage() {
        service.post(count, List.of(line("80", "95", "20")), 3L);

        var request = captureRequest();
        var inventory = request.items().get(0);
        var expense = request.items().get(1);

        assertThat(inventory.accountId()).isEqualTo(INVENTORY_ACCOUNT);
        assertThat(inventory.debit()).isEqualByComparingTo("300");
        assertThat(expense.accountId()).isEqualTo(VARIANCE_ACCOUNT);
        assertThat(expense.credit()).isEqualByComparingTo("300");
    }

    @Test
    void theEntryAlwaysBalances() {
        service.post(count, List.of(line("100", "88", "50"), line("80", "95", "20")), 3L);

        var request = captureRequest();
        var debit = request.items().stream().map(JournalRequest.JournalItemRequest::debit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        var credit = request.items().stream().map(JournalRequest.JournalItemRequest::credit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(debit).isEqualByComparingTo(credit);
    }

    @Test
    void variancesAreNettedAcrossTheWholeCount() {
        // −600 on one line, +300 on another → a net 300 shortfall.
        service.post(count, List.of(line("100", "88", "50"), line("80", "95", "20")), 3L);

        var request = captureRequest();
        assertThat(request.items().get(0).accountId()).isEqualTo(VARIANCE_ACCOUNT);
        assertThat(request.items().get(0).debit()).isEqualByComparingTo("300");
    }

    @Test
    void offsettingVariancesPostNothingRatherThanAZeroEntry() {
        // −600 and +600 cancel: the books were right after all.
        var result = service.post(count, List.of(line("100", "88", "50"), line("80", "110", "20")), 3L);

        assertThat(result).isNull();
        verifyNoInteractions(journalService);
    }

    @Test
    void aCountWhereEverythingMatchedPostsNothing() {
        assertThat(service.post(count, List.of(line("100", "100", "50")), 3L)).isNull();
        verifyNoInteractions(journalService);
    }

    @Test
    void unvaluedVariancesAreLeftOutInsteadOfCountingAsZero() {
        service.post(count, List.of(line("100", "88", "50"), line("40", "10", null)), 3L);

        var request = captureRequest();
        assertThat(request.items().get(0).debit())
                .as("only the line that has a cost may reach the ledger")
                .isEqualByComparingTo("600");
    }

    @Test
    void theEntryPointsBackAtTheCountSheet() {
        service.post(count, List.of(line("100", "88", "50")), 3L);

        var request = captureRequest();
        assertThat(request.referenceType()).isEqualTo("stock_count");
        assertThat(request.referenceId()).isEqualTo(5L);
        assertThat(request.referenceNumber()).isEqualTo("INV-2026-00001");
        assertThat(request.description()).contains("INV-2026-00001", "المستودع الرئيسي");
    }

    @Test
    void theEntryIsPostedNotLeftAsADraft() {
        var number = service.post(count, List.of(line("100", "88", "50")), 3L);

        verify(journalService).post(77L, 3L);
        assertThat(number).isEqualTo("INV-2026-000004");
    }

    @Test
    void anUnmappedVarianceAccountStopsTheCountInsteadOfSkippingTheEntry() {
        when(settingsRepo.findByKey("inventory_variance")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.post(count, List.of(line("100", "88", "50")), 3L))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("فروقات الجرد");

        verify(journalService, never()).create(any(), any());
    }

    @Test
    void aMissingInventoryJournalBookStopsTheCountToo() {
        when(bookRepo.findByCode(INVENTORY_BOOK_CODE)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.post(count, List.of(line("100", "88", "50")), 3L))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("دفتر المخزون");
    }
}
