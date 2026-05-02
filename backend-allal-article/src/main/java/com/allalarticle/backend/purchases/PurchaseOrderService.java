package com.allalarticle.backend.purchases;

import com.allalarticle.backend.audit.AuditLogService;
import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.common.response.PageResponse;
import com.allalarticle.backend.inventory.ProductStockRepository;
import com.allalarticle.backend.inventory.StockMovementRepository;
import com.allalarticle.backend.inventory.WarehouseRepository;
import com.allalarticle.backend.inventory.entity.ProductStock;
import com.allalarticle.backend.inventory.entity.StockMovement;
import com.allalarticle.backend.inventory.entity.Warehouse;
import com.allalarticle.backend.partnerships.PartnerDocumentSyncService;
import com.allalarticle.backend.products.ProductRepository;
import com.allalarticle.backend.purchases.dto.*;
import com.allalarticle.backend.purchases.entity.PurchaseOrder;
import com.allalarticle.backend.purchases.entity.PurchaseOrderItem;
import com.allalarticle.backend.suppliers.SupplierRepository;
import com.allalarticle.backend.tenant.TenantContext;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private final PurchaseOrderRepository poRepo;
    private final ProductRepository productRepo;
    private final SupplierRepository supplierRepo;
    private final WarehouseRepository warehouseRepo;
    private final ProductStockRepository stockRepo;
    private final StockMovementRepository movementRepo;
    private final AuditLogService auditLogService;
    private final JdbcTemplate jdbc;
    private final PartnerDocumentSyncService partnerDocumentSyncService;

    @Transactional(readOnly = true)
    public PageResponse<PurchaseOrderResponse> list(String status, Long supplierId, Pageable pageable) {
        var page = status != null ? poRepo.findByStatus(status, pageable)
                : supplierId != null ? poRepo.findBySupplierId(supplierId, pageable)
                : poRepo.findAll(pageable);
        return PageResponse.from(page.map(PurchaseOrderResponse::from));
    }

    @Transactional(readOnly = true)
    public PurchaseOrderResponse getById(Long id) {
        return poRepo.findById(id).map(PurchaseOrderResponse::from)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Purchase order not found", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public PurchaseOrderResponse create(CreatePurchaseOrderRequest req, Authentication auth) {
        var supplier = supplierRepo.findById(req.supplierId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Supplier not found", HttpStatus.NOT_FOUND));

        var po = PurchaseOrder.builder()
                .poNumber("TEMP")
                .supplier(supplier)
                .supplierName(supplier.getName())
                .expectedDate(req.expectedDate())
                .notes(req.notes())
                .createdById(extractUserId(auth))
                .build();

        var saved = poRepo.save(po);
        saved.setPoNumber("PO-" + Year.now() + "-" + String.format("%06d", saved.getId()));

        BigDecimal total = BigDecimal.ZERO;
        for (var r : req.items()) {
            var product = productRepo.findById(r.productId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Product not found", HttpStatus.NOT_FOUND));
            BigDecimal price = r.unitPrice() != null ? r.unitPrice()
                    : (product.getCurrentPriceAmount() != null ? product.getCurrentPriceAmount() : BigDecimal.ZERO);
            BigDecimal subtotal = price.multiply(r.qty());
            total = total.add(subtotal);
            var item = PurchaseOrderItem.builder()
                    .purchaseOrder(saved)
                    .product(product)
                    .orderedQty(r.qty())
                    .unitPrice(price)
                    .baseUnitPrice(price)
                    .lineSubtotal(subtotal)
                    .notes(r.notes())
                    .build();
            saved.getItems().add(item);
        }
        saved.setTotalAmount(total);
        var finalSaved = poRepo.save(saved);
        poRepo.flush();

        var sync = partnerDocumentSyncService.syncPurchaseOrderToPartnerSale(finalSaved);
        if (sync != null) {
            finalSaved.setLinkedPartnerUuid(sync.linkedPartnerUuid());
            finalSaved.setPartnerDocumentLinkPublicId(sync.documentLinkPublicId());
            finalSaved.setPartnerSourceDocumentPublicId(sync.targetDocumentPublicId());
            finalSaved.setPartnerSyncStatus(sync.syncStatus());
            finalSaved = poRepo.saveAndFlush(finalSaved);
        }

        auditLogService.log(finalSaved.getCreatedById(), "purchase_order", finalSaved.getId(),
                "purchase_order_created",
                "إنشاء أمر شراء — " + finalSaved.getSupplierName(),
                finalSaved.getPoNumber(), "إدارة",
                Map.of(
                        "poNumber", finalSaved.getPoNumber(),
                        "supplierId", finalSaved.getSupplier() != null ? finalSaved.getSupplier().getId() : 0L,
                        "supplierName", finalSaved.getSupplierName(),
                        "totalAmount", finalSaved.getTotalAmount(),
                        "expectedDate", finalSaved.getExpectedDate() != null ? finalSaved.getExpectedDate().toString() : "",
                        "itemsCount", finalSaved.getItems().size()
                ));
        return PurchaseOrderResponse.from(finalSaved);
    }

    @Transactional
    public PurchaseOrderResponse confirm(Long id, Authentication auth) {
        var po = requireStatus(id, "draft");
        po.setStatus("confirmed");
        var saved = poRepo.save(po);
        auditLogService.log(extractUserId(auth), "purchase_order", saved.getId(),
                "confirm_purchase",
                "تأكيد أمر شراء — " + saved.getSupplierName(),
                saved.getPoNumber(), "إدارة",
                purchaseDetails(saved));
        return PurchaseOrderResponse.from(saved);
    }

    @Transactional
    public PurchaseOrderResponse receive(Long id, ReceivePurchaseRequest req, Authentication auth) {
        var po = requireStatus(id, "confirmed");
        Long userId = extractUserId(auth);

        var warehouseOpt = req.warehouseId() != null
                ? warehouseRepo.findById(req.warehouseId())
                : warehouseRepo.findByIsDefaultTrue();
        var warehouse = warehouseOpt.orElseThrow(
                () -> new AppException(ErrorCode.NOT_FOUND, "Warehouse not found", HttpStatus.NOT_FOUND));

        Map<Long, BigDecimal> qtyMap = req.receivedQtyByItemId() != null ? req.receivedQtyByItemId() : Map.of();

        for (var item : po.getItems()) {
            BigDecimal received = qtyMap.getOrDefault(item.getId(), item.getOrderedQty())
                    .min(item.getOrderedQty());
            item.setReceivedQty(received);

            if (received.compareTo(BigDecimal.ZERO) > 0) {
                var stock = stockRepo.findForUpdate(item.getProduct().getId(), warehouse.getId())
                        .orElseGet(() -> ProductStock.builder()
                                .product(item.getProduct()).warehouse(warehouse).build());
                BigDecimal before = stock.getOnHandQty();
                BigDecimal after  = before.add(received);
                stock.setOnHandQty(after);
                stock.setAvailableQty(after.subtract(stock.getReservedQty()));
                stock.setLastRecomputedAt(OffsetDateTime.now());
                stockRepo.save(stock);

                movementRepo.save(StockMovement.builder()
                        .product(item.getProduct())
                        .warehouse(warehouse)
                        .movementType("PURCHASE_IN")
                        .qty(received)
                        .balanceBefore(before)
                        .balanceAfter(after)
                        .sourceType("purchase_order")
                        .sourceId(po.getId())
                        .build());
            }
        }

        po.setStatus("received");
        po.setReceivedDate(req.receivedDate() != null ? req.receivedDate() : LocalDate.now());
        po.setReceivedById(userId);
        var saved = poRepo.save(po);
        auditLogService.log(userId, "purchase_order", saved.getId(),
                "receive_purchase",
                "استلام مشتريات — " + saved.getSupplierName(),
                saved.getPoNumber(), "إدارة",
                purchaseDetails(saved));
        return PurchaseOrderResponse.from(saved);
    }

    @Transactional
    public PurchaseOrderResponse cancel(Long id, Authentication auth) {
        var po = requireStatus(id, "draft", "confirmed");
        po.setStatus("cancelled");
        po.setCancelledAt(OffsetDateTime.now());
        Long userId = extractUserId(auth);
        po.setCancelledById(userId);
        var saved = poRepo.save(po);
        auditLogService.log(userId, "purchase_order", saved.getId(),
                "cancel_purchase",
                "إلغاء أمر شراء — " + saved.getSupplierName(),
                saved.getPoNumber(), "إدارة",
                purchaseDetails(saved));
        return PurchaseOrderResponse.from(saved);
    }

    @Transactional
    public PurchaseOrderResponse registerReturn(Long id, CreatePurchaseReturnRequest req, Authentication auth) {
        var po = requireStatus(id, "received");
        if (req.items() == null || req.items().isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Return items are required", HttpStatus.BAD_REQUEST);
        }

        Long userId = extractUserId(auth);
        var warehouse = resolveReturnWarehouse(po, req.warehouseId());
        var itemsById = po.getItems().stream()
                .collect(Collectors.toMap(PurchaseOrderItem::getId, Function.identity()));
        var lines = new ArrayList<PurchaseReturnLine>();
        var seenItemIds = new HashSet<Long>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal totalQty = BigDecimal.ZERO;

        for (var row : req.items()) {
            if (!seenItemIds.add(row.purchaseOrderItemId())) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Duplicate purchase return item", HttpStatus.BAD_REQUEST);
            }
            var item = itemsById.get(row.purchaseOrderItemId());
            if (item == null) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Purchase return item is not part of this order", HttpStatus.BAD_REQUEST);
            }

            BigDecimal qty = row.qty() != null ? row.qty() : BigDecimal.ZERO;
            if (qty.compareTo(BigDecimal.ZERO) <= 0) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Return quantity must be greater than zero", HttpStatus.BAD_REQUEST);
            }

            BigDecimal receivedQty = valueOrZero(item.getReceivedQty());
            BigDecimal returnedQty = valueOrZero(item.getReturnedQty());
            BigDecimal availableQty = receivedQty.subtract(returnedQty);
            if (qty.compareTo(availableQty) > 0) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Return quantity exceeds received quantity", HttpStatus.BAD_REQUEST);
            }

            BigDecimal unitCost = valueOrZero(item.getUnitPrice());
            BigDecimal lineTotal = unitCost.multiply(qty).setScale(2, RoundingMode.HALF_UP);
            lines.add(new PurchaseReturnLine(item, qty, unitCost, lineTotal, row.notes()));
            totalAmount = totalAmount.add(lineTotal);
            totalQty = totalQty.add(qty);
        }

        String temporaryNumber = "TEMP-PR-" + UUID.randomUUID();
        String schema = quotedTenantSchema();
        Long purchaseReturnId = jdbc.queryForObject(String.format("""
                INSERT INTO %s.purchase_returns
                    (return_number, purchase_order_id, supplier_id, supplier_name, return_date, status,
                     warehouse_id, reason, total_amount, tax_amount, net_amount, accounting_status,
                     stock_posting_status, returned_by, received_by_supplier, created_by, posted_by, posted_at)
                VALUES (?, ?, ?, ?, ?, 'posted', ?, ?, ?, 0, ?, 'pending', 'posted', ?, ?, ?, ?, now())
                RETURNING id
                """, schema),
                Long.class,
                temporaryNumber,
                po.getId(),
                po.getSupplier() != null ? po.getSupplier().getId() : null,
                po.getSupplierName(),
                req.returnDate(),
                warehouse.getId(),
                req.reason(),
                totalAmount,
                totalAmount,
                userId,
                req.receivedBySupplier(),
                userId,
                userId);
        String returnNumber = "PR-" + Year.now() + "-" + String.format("%06d", purchaseReturnId);
        jdbc.update(String.format("UPDATE %s.purchase_returns SET return_number = ?, updated_at = now() WHERE id = ?", schema),
                returnNumber, purchaseReturnId);

        for (var line : lines) {
            var item = line.item();
            var stock = stockRepo.findForUpdate(item.getProduct().getId(), warehouse.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST, "No stock row found for return warehouse", HttpStatus.BAD_REQUEST));
            BigDecimal before = valueOrZero(stock.getOnHandQty());
            if (line.qty().compareTo(before) > 0) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Insufficient stock for purchase return", HttpStatus.BAD_REQUEST);
            }
            BigDecimal after = before.subtract(line.qty());
            stock.setOnHandQty(after);
            stock.setAvailableQty(after.subtract(valueOrZero(stock.getReservedQty())));
            stock.setProjectedQty(after.add(valueOrZero(stock.getPendingQty())).subtract(valueOrZero(stock.getReservedQty())));
            stock.setLastRecomputedAt(OffsetDateTime.now());
            stockRepo.save(stock);

            var movement = movementRepo.save(StockMovement.builder()
                    .product(item.getProduct())
                    .warehouse(warehouse)
                    .movementType("PURCHASE_RETURN_OUT")
                    .qty(line.qty())
                    .balanceBefore(before)
                    .balanceAfter(after)
                    .sourceType("purchase_return")
                    .sourceId(purchaseReturnId)
                    .notes(line.notes())
                    .build());

            item.setReturnedQty(valueOrZero(item.getReturnedQty()).add(line.qty()));
            jdbc.update(String.format("""
                    INSERT INTO %s.purchase_return_items
                        (purchase_return_id, purchase_order_item_id, product_id, returned_qty,
                         unit_cost_amount, tax_rate, tax_amount, line_total_amount, stock_movement_id, notes)
                    VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?, ?)
                    """, schema),
                    purchaseReturnId,
                    item.getId(),
                    item.getProduct().getId(),
                    line.qty(),
                    line.unitCost(),
                    line.lineTotal(),
                    movement.getId(),
                    line.notes());
        }

        var saved = poRepo.save(po);
        var details = purchaseReturnDetails(saved, returnNumber, purchaseReturnId, req, totalAmount, totalQty, warehouse);
        auditLogService.log(userId, "purchase_return", purchaseReturnId,
                "purchase_return_created",
                "إنشاء مرتجع مشتريات — " + saved.getSupplierName(),
                returnNumber, "إدارة", details);
        auditLogService.log(userId, "purchase_return", purchaseReturnId,
                "purchase_return_posted",
                "ترحيل مرتجع مشتريات — " + saved.getSupplierName(),
                returnNumber, "إدارة", details);
        return PurchaseOrderResponse.from(saved);
    }

    private PurchaseOrder requireStatus(Long id, String... allowed) {
        var po = poRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Purchase order not found", HttpStatus.NOT_FOUND));
        for (var s : allowed) if (s.equals(po.getStatus())) return po;
        throw new AppException(ErrorCode.BAD_REQUEST,
                "Invalid transition from status: " + po.getStatus(), HttpStatus.BAD_REQUEST);
    }

    private Long extractUserId(Authentication auth) {
        if (auth instanceof UsernamePasswordAuthenticationToken t
                && t.getDetails() instanceof Claims c) return c.get("userId", Long.class);
        return null;
    }

    private Warehouse resolveReturnWarehouse(PurchaseOrder po, Long warehouseId) {
        if (warehouseId != null) {
            return warehouseRepo.findById(warehouseId)
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Warehouse not found", HttpStatus.NOT_FOUND));
        }
        return movementRepo.findFirstBySourceTypeAndSourceIdAndMovementTypeOrderByCreatedAtDesc(
                        "purchase_order", po.getId(), "PURCHASE_IN")
                .map(StockMovement::getWarehouse)
                .or(() -> warehouseRepo.findByIsDefaultTrue())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Warehouse not found", HttpStatus.NOT_FOUND));
    }

    private BigDecimal valueOrZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private String valueOrEmpty(String value) {
        return value != null ? value : "";
    }

    private String quotedTenantSchema() {
        String schema = TenantContext.get();
        if (!TenantContext.isValidSchema(schema)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Invalid tenant context", HttpStatus.BAD_REQUEST);
        }
        return "\"" + schema + "\"";
    }

    private Map<String, Object> purchaseDetails(PurchaseOrder po) {
        return Map.of(
                "poNumber", po.getPoNumber(),
                "supplierId", po.getSupplier() != null ? po.getSupplier().getId() : 0L,
                "supplierName", po.getSupplierName(),
                "status", po.getStatus(),
                "totalAmount", po.getTotalAmount(),
                "receivedDate", po.getReceivedDate() != null ? po.getReceivedDate().toString() : "",
                "itemsCount", po.getItems().size()
        );
    }

    private Map<String, Object> purchaseReturnDetails(PurchaseOrder po, String returnNumber,
                                                       Long purchaseReturnId, CreatePurchaseReturnRequest req,
                                                       BigDecimal totalAmount, BigDecimal totalQty,
                                                       Warehouse warehouse) {
        var details = new LinkedHashMap<String, Object>();
        details.put("returnNumber", returnNumber);
        details.put("purchaseReturnId", purchaseReturnId);
        details.put("poNumber", po.getPoNumber());
        details.put("purchaseOrderId", po.getId());
        details.put("supplierId", po.getSupplier() != null ? po.getSupplier().getId() : 0L);
        details.put("supplierName", po.getSupplierName());
        details.put("status", "posted");
        details.put("totalAmount", totalAmount);
        details.put("netAmount", totalAmount);
        details.put("totalQty", totalQty);
        details.put("returnDate", req.returnDate().toString());
        details.put("warehouseId", warehouse.getId());
        details.put("warehouseName", warehouse.getName());
        details.put("receivedBySupplier", valueOrEmpty(req.receivedBySupplier()));
        details.put("reason", valueOrEmpty(req.reason()));
        details.put("itemsCount", req.items().size());
        return details;
    }

    private record PurchaseReturnLine(
            PurchaseOrderItem item,
            BigDecimal qty,
            BigDecimal unitCost,
            BigDecimal lineTotal,
            String notes
    ) {}
}
