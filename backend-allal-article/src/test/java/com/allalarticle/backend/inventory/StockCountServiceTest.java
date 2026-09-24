package com.allalarticle.backend.inventory;

import com.allalarticle.backend.audit.AuditLogService;
import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.inventory.entity.ProductStock;
import com.allalarticle.backend.inventory.entity.StockCount;
import com.allalarticle.backend.inventory.entity.StockCountItem;
import com.allalarticle.backend.inventory.entity.StockMovement;
import com.allalarticle.backend.inventory.entity.Warehouse;
import com.allalarticle.backend.products.ProductRepository;
import com.allalarticle.backend.products.entity.Product;
import com.allalarticle.backend.users.TenantUserRepository;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class StockCountServiceTest {

    @Mock StockCountRepository countRepo;
    @Mock StockCountItemRepository itemRepo;
    @Mock ProductStockRepository stockRepo;
    @Mock StockMovementRepository movementRepo;
    @Mock ProductRepository productRepo;
    @Mock WarehouseRepository warehouseRepo;
    @Mock TenantUserRepository userRepo;
    @Mock AuditLogService auditLogService;
    @Mock StockCountPostingService postingService;

    @InjectMocks StockCountService service;

    private Warehouse warehouse;
    private Product product;

    @BeforeEach
    void setUp() {
        warehouse = Warehouse.builder().id(1L).code("MAIN").name("المستودع الرئيسي").build();
        product = Product.builder().id(7L).sku("ART-007").name("حليب").build();
        when(countRepo.save(any(StockCount.class))).thenAnswer(i -> i.getArgument(0));
        when(itemRepo.save(any(StockCountItem.class))).thenAnswer(i -> i.getArgument(0));
        when(stockRepo.save(any(ProductStock.class))).thenAnswer(i -> i.getArgument(0));
        when(movementRepo.save(any(StockMovement.class))).thenAnswer(i -> i.getArgument(0));
    }

    private StockCount countInReview(StockCountItem... items) {
        var count = StockCount.builder()
                .id(5L).reference("INV-2026-00005").warehouse(warehouse)
                .status(StockCount.REVIEW).blind(true).build();
        for (var item : items) item.setStockCount(count);
        when(countRepo.findById(5L)).thenReturn(Optional.of(count));
        when(itemRepo.findByStockCountIdOrderByIdAsc(5L)).thenReturn(List.of(items));
        return count;
    }

    private StockCountItem item(String systemQty, String countedQty, String cost) {
        return StockCountItem.builder()
                .id(1L).product(product)
                .systemQty(new BigDecimal(systemQty))
                .countedQty(countedQty == null ? null : new BigDecimal(countedQty))
                .unitCost(cost == null ? null : new BigDecimal(cost))
                .build();
    }

    private ProductStock stockOnHand(String onHand, String reserved) {
        var stock = ProductStock.builder()
                .id(3L).product(product).warehouse(warehouse)
                .onHandQty(new BigDecimal(onHand))
                .reservedQty(new BigDecimal(reserved))
                .build();
        when(stockRepo.findForUpdate(7L, 1L)).thenReturn(Optional.of(stock));
        return stock;
    }

    // ─── Approval ────────────────────────────────────────────────────────────

    @Test
    void approvalSetsTheBalanceToWhatWasCounted_notTheSnapshotPlusTheDifference() {
        countInReview(item("100", "88", "50"));
        // Stock moved after the snapshot was frozen: 100 → 120.
        var stock = stockOnHand("120", "0");

        service.approve(5L, null);

        assertThat(stock.getOnHandQty())
                .as("the shelf holds 88; a sale recorded after the snapshot must not survive the count")
                .isEqualByComparingTo("88");
    }

    @Test
    void approvalRecordsAShortfallAsCountOutCarryingTheRealBalances() {
        countInReview(item("100", "88", "50"));
        stockOnHand("100", "0");

        service.approve(5L, null);

        var movement = ArgumentCaptor.forClass(StockMovement.class);
        verify(movementRepo).save(movement.capture());
        assertThat(movement.getValue().getMovementType()).isEqualTo("COUNT_OUT");
        assertThat(movement.getValue().getQty()).isEqualByComparingTo("12");
        assertThat(movement.getValue().getBalanceBefore()).isEqualByComparingTo("100");
        assertThat(movement.getValue().getBalanceAfter()).isEqualByComparingTo("88");
        assertThat(movement.getValue().getSourceType()).isEqualTo("stock_count");
    }

    @Test
    void approvalRecordsASurplusAsCountIn() {
        countInReview(item("100", "115", "50"));
        stockOnHand("100", "0");

        service.approve(5L, null);

        var movement = ArgumentCaptor.forClass(StockMovement.class);
        verify(movementRepo).save(movement.capture());
        assertThat(movement.getValue().getMovementType()).isEqualTo("COUNT_IN");
        assertThat(movement.getValue().getQty()).isEqualByComparingTo("15");
    }

    @Test
    void aShortfallIsAppliedEvenWhenTheMissingStockWasReserved() {
        countInReview(item("100", "20", "50"));
        var stock = stockOnHand("100", "60");

        // An ordinary adjustment refuses this. A count must not: stock reserved for an order but
        // missing from the shelf is precisely what the count exists to expose.
        assertThatNoException().isThrownBy(() -> service.approve(5L, null));

        assertThat(stock.getOnHandQty()).isEqualByComparingTo("20");
        assertThat(stock.getAvailableQty())
                .as("a negative available quantity is a real oversell, and must stay visible")
                .isEqualByComparingTo("-40");
    }

    @Test
    void linesThatMatchProduceNoMovementAtAll() {
        countInReview(item("100", "100", "50"));

        service.approve(5L, null);

        verifyNoInteractions(movementRepo);
        verify(stockRepo, never()).save(any());
    }

    @Test
    void uncountedLinesAreLeftAloneRatherThanTreatedAsZero() {
        countInReview(item("100", null, "50"));

        service.approve(5L, null);

        verifyNoInteractions(movementRepo);
    }

    @Test
    void approvalStampsTheCountAndClosesIt() {
        var count = countInReview(item("100", "90", "50"));
        stockOnHand("100", "0");

        var response = service.approve(5L, null);

        assertThat(count.getStatus()).isEqualTo(StockCount.APPROVED);
        assertThat(count.getApprovedAt()).isNotNull();
        assertThat(response.netVarianceQty()).isEqualByComparingTo("-10");
        assertThat(response.netVarianceValue()).isEqualByComparingTo("-500");
    }

    // ─── Lifecycle guards ────────────────────────────────────────────────────

    @Test
    void anApprovedCountCannotBeApprovedTwice() {
        var count = StockCount.builder().id(5L).warehouse(warehouse).status(StockCount.APPROVED).build();
        when(countRepo.findById(5L)).thenReturn(Optional.of(count));

        assertThatThrownBy(() -> service.approve(5L, null))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("approved");

        verifyNoInteractions(movementRepo);
    }

    @Test
    void anOpenCountCannotBeApprovedBeforeItIsReviewed() {
        var count = StockCount.builder().id(5L).warehouse(warehouse).status(StockCount.OPEN).build();
        when(countRepo.findById(5L)).thenReturn(Optional.of(count));

        assertThatThrownBy(() -> service.approve(5L, null)).isInstanceOf(AppException.class);
        verifyNoInteractions(movementRepo);
    }

    @Test
    void closingIsRefusedWhileAnyLineIsStillUncounted() {
        var count = StockCount.builder()
                .id(5L).warehouse(warehouse).status(StockCount.OPEN).build();
        when(countRepo.findById(5L)).thenReturn(Optional.of(count));
        when(itemRepo.findByStockCountIdOrderByIdAsc(5L))
                .thenReturn(List.of(item("100", "100", "5"), item("50", null, "5")));

        assertThatThrownBy(() -> service.closeForReview(5L, null))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("1");

        assertThat(count.getStatus()).isEqualTo(StockCount.OPEN);
    }

    @Test
    void closingMovesAFullyCountedSheetToReview() {
        var count = StockCount.builder()
                .id(5L).warehouse(warehouse).status(StockCount.OPEN).build();
        when(countRepo.findById(5L)).thenReturn(Optional.of(count));
        when(itemRepo.findByStockCountIdOrderByIdAsc(5L)).thenReturn(List.of(item("100", "0", "5")));

        service.closeForReview(5L, null);

        assertThat(count.getStatus()).isEqualTo(StockCount.REVIEW);
        assertThat(count.getClosedAt()).isNotNull();
    }

    @Test
    void aWarehouseCannotHaveTwoCountsRunningAtOnce() {
        when(warehouseRepo.findById(1L)).thenReturn(Optional.of(warehouse));
        when(countRepo.findFirstByWarehouseIdAndStatusIn(eq(1L), any()))
                .thenReturn(Optional.of(StockCount.builder().reference("INV-2026-00001").build()));

        assertThatThrownBy(() -> service.open(
                new com.allalarticle.backend.inventory.dto.StockCountRequest(1L, true, null, null, null), null))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("INV-2026-00001");
    }

    // ─── Blind counting ──────────────────────────────────────────────────────

    @Test
    void anOpenBlindCountWithholdsTheSystemQuantityFromTheSheet() {
        var count = StockCount.builder()
                .id(5L).warehouse(warehouse).status(StockCount.OPEN).blind(true).build();
        when(countRepo.findById(5L)).thenReturn(Optional.of(count));
        when(itemRepo.findByStockCountIdOrderByIdAsc(5L)).thenReturn(List.of(item("100", null, "50")));

        var line = service.get(5L).items().get(0);

        assertThat(line.systemQty()).as("seeing the expected number biases the counter").isNull();
        assertThat(line.difference()).isNull();
        assertThat(line.productSku()).isEqualTo("ART-007");
    }

    @Test
    void theDifferencesAppearOnceTheCountReachesReview() {
        countInReview(item("100", "88", "50"));

        var line = service.get(5L).items().get(0);

        assertThat(line.systemQty()).isEqualByComparingTo("100");
        assertThat(line.difference()).isEqualByComparingTo("-12");
        assertThat(line.differenceValue()).isEqualByComparingTo("-600");
    }

    // ─── Accounting ──────────────────────────────────────────────────────────

    @Test
    void approvalRecordsTheJournalNumberOnTheCount() {
        var count = countInReview(item("100", "88", "50"));
        stockOnHand("100", "0");
        when(postingService.post(any(), any(), any())).thenReturn("INV-2026-000004");

        var response = service.approve(5L, null);

        assertThat(count.getJournalNumber()).isEqualTo("INV-2026-000004");
        assertThat(response.journalNumber()).isEqualTo("INV-2026-000004");
    }

    @Test
    void aLedgerThatRefusesTheEntryStopsTheStockChangeToo() {
        var count = countInReview(item("100", "88", "50"));
        var stock = stockOnHand("100", "0");
        when(postingService.post(any(), any(), any()))
                .thenThrow(new AppException(
                        com.allalarticle.backend.common.exception.ErrorCode.BAD_REQUEST,
                        "لا توجد سنة مالية مفتوحة",
                        org.springframework.http.HttpStatus.BAD_REQUEST));

        // The transaction rolls back around both, so books and shelves cannot drift apart.
        assertThatThrownBy(() -> service.approve(5L, null))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("سنة مالية");

        assertThat(count.getStatus())
                .as("the count must stay reviewable rather than be left half-applied")
                .isEqualTo(StockCount.REVIEW);
        assertThat(count.getApprovedAt()).isNull();
    }
}
