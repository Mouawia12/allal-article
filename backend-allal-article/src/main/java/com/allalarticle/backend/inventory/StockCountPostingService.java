package com.allalarticle.backend.inventory;

import com.allalarticle.backend.accounting.dto.JournalRequest;
import com.allalarticle.backend.accounting.repository.AccountingSettingsRepository;
import com.allalarticle.backend.accounting.repository.JournalBookRepository;
import com.allalarticle.backend.accounting.service.JournalService;
import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.inventory.entity.StockCount;
import com.allalarticle.backend.inventory.entity.StockCountItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

/**
 * Turns an approved count's variances into a journal entry.
 *
 * Stock that vanished is an expense; stock that appeared reverses one. Without this the books
 * would keep carrying inventory the warehouse no longer holds, which is the divergence a count
 * exists to end — so a count that cannot be posted is refused rather than quietly applied.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StockCountPostingService {

    /** The seeded journal book for stock entries — its code, not its "INV" numbering prefix. */
    private static final String INVENTORY_BOOK = "inventory";
    private static final String INVENTORY_ACCOUNT = "inventory";
    private static final String VARIANCE_ACCOUNT = "inventory_variance";

    private final JournalService journalService;
    private final JournalBookRepository bookRepo;
    private final AccountingSettingsRepository settingsRepo;

    /**
     * Posts the net variance of a count.
     *
     * <pre>
     * shortage (counted &lt; system):  Dr فروقات جرد ومخزون   Cr مخزون البضاعة
     * surplus  (counted &gt; system):  Dr مخزون البضاعة        Cr فروقات جرد ومخزون
     * </pre>
     *
     * @return the journal number, or null when there was nothing worth posting
     */
    public String post(StockCount count, List<StockCountItem> items, Long userId) {
        BigDecimal net = items.stream()
                .map(StockCountItem::differenceValue)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        // A count where everything matched, or where the differences cancel out in money, leaves
        // the books unchanged. Posting a zero entry would only add noise to the ledger.
        if (net.signum() == 0) {
            log.info("Stock count {} has no net variance to post", count.getReference());
            return null;
        }

        var book = bookRepo.findByCode(INVENTORY_BOOK)
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST,
                        "دفتر المخزون غير معرّف في دليل اليوميات", HttpStatus.BAD_REQUEST));
        Long inventoryAccountId = account(INVENTORY_ACCOUNT, "حساب مخزون البضاعة");
        Long varianceAccountId = account(VARIANCE_ACCOUNT, "حساب فروقات الجرد");

        BigDecimal amount = net.abs();
        boolean surplus = net.signum() > 0;
        String description = "فروقات جرد " + count.getReference() + " — " + count.getWarehouse().getName();

        var lines = surplus
                ? List.of(
                    line(inventoryAccountId, amount, BigDecimal.ZERO, "زيادة جرد"),
                    line(varianceAccountId, BigDecimal.ZERO, amount, "زيادة جرد"))
                : List.of(
                    line(varianceAccountId, amount, BigDecimal.ZERO, "عجز جرد"),
                    line(inventoryAccountId, BigDecimal.ZERO, amount, "عجز جرد"));

        var journal = journalService.create(new JournalRequest(
                book.getId(),
                LocalDate.now(),
                description,
                "stock_count",
                count.getId(),
                count.getReference(),
                lines), userId);

        // A count is a settled fact, so its entry is posted rather than left as a draft someone
        // has to remember to confirm.
        var posted = journalService.post(journal.id(), userId);
        log.info("Stock count {} posted as journal {} ({} {})",
                count.getReference(), posted.journalNumber(), surplus ? "surplus" : "shortage", amount);
        return posted.journalNumber();
    }

    private JournalRequest.JournalItemRequest line(Long accountId, BigDecimal debit, BigDecimal credit, String label) {
        return new JournalRequest.JournalItemRequest(accountId, debit, credit, label, null);
    }

    private Long account(String key, String label) {
        var setting = settingsRepo.findByKey(key)
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST,
                        label + " غير مربوط في إعدادات المحاسبة", HttpStatus.BAD_REQUEST));
        if (setting.getAccount() == null) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    label + " غير مربوط في إعدادات المحاسبة", HttpStatus.BAD_REQUEST);
        }
        return setting.getAccount().getId();
    }
}
