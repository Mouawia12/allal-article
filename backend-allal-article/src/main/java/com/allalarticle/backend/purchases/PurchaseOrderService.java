package com.allalarticle.backend.purchases;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.common.response.PageResponse;
import com.allalarticle.backend.inventory.ProductStockRepository;
import com.allalarticle.backend.inventory.StockMovementRepository;
import com.allalarticle.backend.inventory.WarehouseRepository;
import com.allalarticle.backend.inventory.entity.ProductStock;
import com.allalarticle.backend.inventory.entity.StockMovement;
import com.allalarticle.backend.products.ProductRepository;
import com.allalarticle.backend.purchases.dto.*;
import com.allalarticle.backend.purchases.entity.PurchaseOrder;
import com.allalarticle.backend.purchases.entity.PurchaseOrderItem;
import com.allalarticle.backend.suppliers.SupplierRepository;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Year;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private final PurchaseOrderRepository poRepo;
    private final ProductRepository productRepo;
    private final SupplierRepository supplierRepo;
    private final WarehouseRepository warehouseRepo;
    private final ProductStockRepository stockRepo;
    private final StockMovementRepository movementRepo;

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
        return PurchaseOrderResponse.from(poRepo.save(saved));
    }

    @Transactional
    public PurchaseOrderResponse confirm(Long id, Authentication auth) {
        var po = requireStatus(id, "draft");
        po.setStatus("confirmed");
        return PurchaseOrderResponse.from(poRepo.save(po));
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
        return PurchaseOrderResponse.from(poRepo.save(po));
    }

    @Transactional
    public PurchaseOrderResponse cancel(Long id, Authentication auth) {
        var po = requireStatus(id, "draft", "confirmed");
        po.setStatus("cancelled");
        po.setCancelledAt(OffsetDateTime.now());
        po.setCancelledById(extractUserId(auth));
        return PurchaseOrderResponse.from(poRepo.save(po));
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
}
