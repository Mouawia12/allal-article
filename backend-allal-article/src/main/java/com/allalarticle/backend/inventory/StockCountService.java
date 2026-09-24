package com.allalarticle.backend.inventory;

import com.allalarticle.backend.audit.AuditLogService;
import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.common.response.PageResponse;
import com.allalarticle.backend.inventory.dto.*;
import com.allalarticle.backend.inventory.entity.ProductStock;
import com.allalarticle.backend.inventory.entity.StockCount;
import com.allalarticle.backend.inventory.entity.StockCountItem;
import com.allalarticle.backend.inventory.entity.StockMovement;
import com.allalarticle.backend.products.ProductRepository;
import com.allalarticle.backend.products.entity.Product;
import com.allalarticle.backend.users.TenantUserRepository;
import com.allalarticle.backend.users.entity.TenantUser;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.Year;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Physical inventory counts.
 *
 * The document exists so that counting and correcting are separate acts. Opening a count freezes
 * what the system believes; people then record what they actually found; only approval turns the
 * differences into stock movements. Between those moments nothing in live stock moves because of
 * the count, so a sheet can be checked, recounted and challenged without consequence.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StockCountService {

    private final StockCountRepository countRepo;
    private final StockCountItemRepository itemRepo;
    private final ProductStockRepository stockRepo;
    private final StockMovementRepository movementRepo;
    private final ProductRepository productRepo;
    private final WarehouseRepository warehouseRepo;
    private final TenantUserRepository userRepo;
    private final AuditLogService auditLogService;
    private final StockCountPostingService postingService;

    // ─── Reading ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<StockCountResponse> list(Long warehouseId, String status, Pageable pageable) {
        var page = warehouseId != null
                ? countRepo.findByWarehouseId(warehouseId, pageable)
                : status != null && !status.isBlank()
                    ? countRepo.findByStatus(status, pageable)
                    : countRepo.findAll(pageable);
        return PageResponse.from(page.map(c ->
                StockCountResponse.summary(c, itemRepo.findByStockCountIdOrderByIdAsc(c.getId()))));
    }

    @Transactional(readOnly = true)
    public StockCountResponse get(Long id) {
        var count = require(id);
        return StockCountResponse.detail(count, itemRepo.findByStockCountIdOrderByIdAsc(id));
    }

    // ─── Opening ──────────────────────────────────────────────────────────────

    /** Opens a count and freezes the warehouse's current quantities and costs onto the sheet. */
    @Transactional
    public StockCountResponse open(StockCountRequest req, Authentication auth) {
        var warehouse = warehouseRepo.findById(req.warehouseId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Warehouse not found", HttpStatus.NOT_FOUND));

        countRepo.findFirstByWarehouseIdAndStatusIn(
                        warehouse.getId(), List.of(StockCount.OPEN, StockCount.REVIEW))
                .ifPresent(existing -> {
                    throw new AppException(ErrorCode.CONFLICT,
                            "يوجد جرد جارٍ لهذا المستودع: " + existing.getReference(), HttpStatus.CONFLICT);
                });

        var count = countRepo.save(StockCount.builder()
                .reference("TEMP")
                .warehouse(warehouse)
                .status(StockCount.OPEN)
                .blind(req.blind() == null || req.blind())
                .scheduledFor(req.scheduledFor())
                .notes(req.notes())
                .createdBy(userId(auth))
                .build());
        count.setReference("INV-" + Year.now() + "-" + String.format("%05d", count.getId()));

        for (Product product : productsToCount(req)) {
            BigDecimal systemQty = stockRepo.findForUpdate(product.getId(), warehouse.getId())
                    .map(ProductStock::getOnHandQty)
                    .orElse(BigDecimal.ZERO);
            itemRepo.save(StockCountItem.builder()
                    .stockCount(count)
                    .product(product)
                    .systemQty(systemQty)
                    .unitCost(product.getCostAmount())
                    .build());
        }

        var items = itemRepo.findByStockCountIdOrderByIdAsc(count.getId());
        if (items.isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "لا توجد أصناف لجردها في هذا المستودع", HttpStatus.BAD_REQUEST);
        }

        auditLogService.log(userId(auth), "stock_count", count.getId(), "stock_count_opened",
                "فتح جرد — " + warehouse.getName(), count.getReference(), "مخزون",
                Map.of("countId", count.getId(),
                        "reference", count.getReference(),
                        "warehouseId", warehouse.getId(),
                        "warehouseName", warehouse.getName(),
                        "itemCount", items.size()));

        return StockCountResponse.detail(count, items);
    }

    private List<Product> productsToCount(StockCountRequest req) {
        if (req.productIds() != null && !req.productIds().isEmpty()) {
            var products = productRepo.findAllById(req.productIds()).stream()
                    .filter(p -> p.getDeletedAt() == null)
                    .toList();
            if (products.size() != req.productIds().size()) {
                throw new AppException(ErrorCode.BAD_REQUEST,
                        "بعض الأصناف المحددة غير موجودة", HttpStatus.BAD_REQUEST);
            }
            return products;
        }
        // A full count covers everything the warehouse could hold, including products the system
        // shows as empty — stock found where the system expected none is exactly what a count is for.
        return productRepo.findAll().stream()
                .filter(p -> p.getDeletedAt() == null)
                .filter(p -> !"archived".equals(p.getStatus()))
                .toList();
    }

    // ─── Counting ─────────────────────────────────────────────────────────────

    /**
     * Records counted quantities. While the count is open these are first counts; once it is in
     * review the same call records an independent recount, which supersedes the first.
     */
    @Transactional
    public StockCountResponse recordEntries(Long id, List<StockCountEntryRequest> entries, Authentication auth) {
        var count = require(id);
        requireEditable(count);

        boolean isRecount = StockCount.REVIEW.equals(count.getStatus());
        for (var entry : entries) {
            var item = itemRepo.findByIdAndStockCountId(entry.itemId(), id)
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND,
                            "سطر الجرد غير موجود", HttpStatus.NOT_FOUND));
            if (isRecount) {
                item.setRecountQty(entry.countedQty());
            } else {
                item.setCountedQty(entry.countedQty());
            }
            if (entry.reason() != null) item.setReason(entry.reason());
            if (entry.notes() != null) item.setNotes(entry.notes());
            item.setCountedBy(userId(auth));
            item.setCountedAt(OffsetDateTime.now());
            itemRepo.save(item);
        }

        return StockCountResponse.detail(count, itemRepo.findByStockCountIdOrderByIdAsc(id));
    }

    /** Closes counting and reveals the differences for review. */
    @Transactional
    public StockCountResponse closeForReview(Long id, Authentication auth) {
        var count = require(id);
        if (!StockCount.OPEN.equals(count.getStatus())) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "لا يمكن إقفال جرد حالته: " + count.getStatus(), HttpStatus.BAD_REQUEST);
        }

        var items = itemRepo.findByStockCountIdOrderByIdAsc(id);
        long uncounted = items.stream().filter(i -> !i.isCounted()).count();
        if (uncounted > 0) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "بقي " + uncounted + " صنفاً بلا عدّ — أدخل صفراً لما لم تجده",
                    HttpStatus.BAD_REQUEST);
        }

        count.setStatus(StockCount.REVIEW);
        count.setClosedBy(userId(auth));
        count.setClosedAt(OffsetDateTime.now());
        countRepo.save(count);

        return StockCountResponse.detail(count, items);
    }

    // ─── Approving ────────────────────────────────────────────────────────────

    /**
     * Applies the count: every line whose counted quantity differs from the frozen one becomes a
     * stock movement and the warehouse balance is set to what was actually found.
     *
     * The balance is set rather than added to. A count is a statement of fact about the shelf, so
     * a movement that happened after the snapshot must not survive it — and unlike an ordinary
     * adjustment, a shortfall is never refused for exceeding the available quantity: stock that is
     * reserved but missing is the very thing a count is meant to expose.
     */
    @Transactional
    public StockCountResponse approve(Long id, Authentication auth) {
        var count = require(id);
        if (!StockCount.REVIEW.equals(count.getStatus())) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "لا يمكن اعتماد جرد حالته: " + count.getStatus(), HttpStatus.BAD_REQUEST);
        }

        var warehouse = count.getWarehouse();
        var items = itemRepo.findByStockCountIdOrderByIdAsc(id);
        int applied = 0;
        BigDecimal netQty = BigDecimal.ZERO;
        BigDecimal netValue = BigDecimal.ZERO;

        for (StockCountItem item : items) {
            BigDecimal difference = item.difference();
            if (difference == null || difference.signum() == 0) continue;

            var stock = stockRepo.findForUpdate(item.getProduct().getId(), warehouse.getId())
                    .orElseGet(() -> ProductStock.builder()
                            .product(item.getProduct()).warehouse(warehouse).build());

            BigDecimal before = stock.getOnHandQty();
            BigDecimal after = item.finalQty();
            stock.setOnHandQty(after);
            stock.setAvailableQty(after.subtract(safe(stock.getReservedQty())));
            stock.setProjectedQty(stock.getAvailableQty().add(safe(stock.getPendingQty())));
            stock.setLastRecomputedAt(OffsetDateTime.now());
            stockRepo.save(stock);

            movementRepo.save(StockMovement.builder()
                    .product(item.getProduct())
                    .warehouse(warehouse)
                    .movementType(difference.signum() > 0 ? "COUNT_IN" : "COUNT_OUT")
                    .qty(difference.abs())
                    .balanceBefore(before)
                    .balanceAfter(after)
                    .sourceType("stock_count")
                    .sourceId(count.getId())
                    .notes(item.getReason())
                    .performedBy(resolveUser(auth))
                    .build());

            applied++;
            netQty = netQty.add(difference);
            if (item.differenceValue() != null) netValue = netValue.add(item.differenceValue());
        }

        // Posting runs inside the same transaction as the stock movements: if the ledger cannot
        // accept the entry, the quantities must not change either, or the two would drift apart.
        String journalNumber = postingService.post(count, items, userId(auth));

        count.setStatus(StockCount.APPROVED);
        count.setApprovedBy(userId(auth));
        count.setApprovedAt(OffsetDateTime.now());
        count.setJournalNumber(journalNumber);
        countRepo.save(count);

        Map<String, Object> details = new HashMap<>();
        details.put("countId", count.getId());
        details.put("reference", count.getReference());
        details.put("warehouseId", warehouse.getId());
        details.put("warehouseName", warehouse.getName());
        details.put("adjustedItems", applied);
        details.put("netVarianceQty", netQty);
        details.put("netVarianceValue", netValue);
        details.put("journalNumber", journalNumber != null ? journalNumber : "");
        auditLogService.log(userId(auth), "stock_count", count.getId(), "stock_count_approved",
                "اعتماد جرد — " + warehouse.getName(), count.getReference(), "مخزون", details);

        log.info("Stock count {} approved: {} lines adjusted, net {} ({}), journal {}",
                count.getReference(), applied, netQty, netValue, journalNumber);

        return StockCountResponse.detail(count, items);
    }

    @Transactional
    public StockCountResponse cancel(Long id, Authentication auth) {
        var count = require(id);
        requireEditable(count);
        count.setStatus(StockCount.CANCELLED);
        countRepo.save(count);

        auditLogService.log(userId(auth), "stock_count", count.getId(), "stock_count_cancelled",
                "إلغاء جرد — " + count.getWarehouse().getName(), count.getReference(), "مخزون",
                Map.of("countId", count.getId(), "reference", count.getReference()));

        return StockCountResponse.detail(count, itemRepo.findByStockCountIdOrderByIdAsc(id));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private StockCount require(Long id) {
        return countRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Stock count not found", HttpStatus.NOT_FOUND));
    }

    private void requireEditable(StockCount count) {
        if (!count.isEditable()) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "الجرد مغلق ولا يقبل التعديل: " + count.getStatus(), HttpStatus.BAD_REQUEST);
        }
    }

    private static BigDecimal safe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private Long userId(Authentication auth) {
        if (auth instanceof UsernamePasswordAuthenticationToken t
                && t.getDetails() instanceof Claims claims) {
            return claims.get("userId", Long.class);
        }
        return null;
    }

    private TenantUser resolveUser(Authentication auth) {
        Long id = userId(auth);
        return id != null ? userRepo.getReferenceById(id) : null;
    }
}
