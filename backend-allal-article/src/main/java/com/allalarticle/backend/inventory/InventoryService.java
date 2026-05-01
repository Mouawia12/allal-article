package com.allalarticle.backend.inventory;

import com.allalarticle.backend.audit.AuditLogService;
import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.common.response.PageResponse;
import com.allalarticle.backend.inventory.dto.*;
import com.allalarticle.backend.inventory.entity.ProductStock;
import com.allalarticle.backend.inventory.entity.StockMovement;
import com.allalarticle.backend.inventory.entity.Warehouse;
import com.allalarticle.backend.products.ProductRepository;
import com.allalarticle.backend.users.TenantUserRepository;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final ProductStockRepository stockRepo;
    private final StockMovementRepository movementRepo;
    private final ProductRepository productRepo;
    private final WarehouseRepository warehouseRepo;
    private final WarehouseService warehouseService;
    private final TenantUserRepository userRepo;
    private final AuditLogService auditLogService;

    @Transactional
    public PageResponse<StockSummaryResponse> listStock(Long warehouseId, Pageable pageable) {
        ensureStockRows(warehouseId);
        var page = warehouseId != null
                ? stockRepo.findByWarehouseId(warehouseId, pageable)
                : stockRepo.findAll(pageable);
        return PageResponse.from(page.map(StockSummaryResponse::from));
    }

    @Transactional
    public List<StockSummaryResponse> getProductStock(Long productId) {
        ensureStockRowsForProduct(productId);
        return stockRepo.findByProductId(productId).stream()
                .map(StockSummaryResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<StockMovementResponse> listMovements(Long productId, Long warehouseId, Pageable pageable) {
        var page = (productId != null && warehouseId != null)
                ? movementRepo.findByProductIdAndWarehouseId(productId, warehouseId, pageable)
                : (productId != null)
                    ? movementRepo.findByProductId(productId, pageable)
                    : (warehouseId != null)
                        ? movementRepo.findByWarehouseId(warehouseId, pageable)
                        : movementRepo.findAll(pageable);
        return PageResponse.from(page.map(StockMovementResponse::from));
    }

    @Transactional
    public StockSummaryResponse setInitialStock(InitialStockRequest req, Authentication auth) {
        var existing = stockRepo.findForUpdate(req.productId(), req.warehouseId());
        if (existing.isPresent() && existing.get().getOnHandQty().compareTo(BigDecimal.ZERO) != 0) {
            throw new AppException(ErrorCode.CONFLICT,
                    "Initial stock already set — use adjustment instead", HttpStatus.CONFLICT);
        }

        var product   = productRepo.findById(req.productId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Product not found", HttpStatus.NOT_FOUND));
        var warehouse = warehouseRepo.findById(req.warehouseId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Warehouse not found", HttpStatus.NOT_FOUND));

        var stock = existing.orElseGet(() -> ProductStock.builder()
                .product(product).warehouse(warehouse).build());

        stock.setOnHandQty(req.qty());
        recompute(stock);
        var saved = stockRepo.save(stock);

        movementRepo.save(StockMovement.builder()
                .product(product)
                .warehouse(warehouse)
                .movementType("INITIAL_STOCK")
                .qty(req.qty())
                .balanceBefore(BigDecimal.ZERO)
                .balanceAfter(req.qty())
                .notes("Initial stock entry")
                .performedBy(resolveUser(auth))
                .build());

        return StockSummaryResponse.from(saved);
    }

    @Transactional
    public StockMovementResponse adjust(StockAdjustmentRequest req, Authentication auth) {
        boolean isIn = "IN".equalsIgnoreCase(req.type());

        var product   = productRepo.findById(req.productId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Product not found", HttpStatus.NOT_FOUND));
        var warehouse = warehouseRepo.findById(req.warehouseId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Warehouse not found", HttpStatus.NOT_FOUND));

        var stock = stockRepo.findForUpdate(req.productId(), req.warehouseId())
                .orElseGet(() -> ProductStock.builder()
                        .product(product).warehouse(warehouse).build());

        BigDecimal before = stock.getOnHandQty();
        BigDecimal after;

        if (isIn) {
            after = before.add(req.qty());
        } else {
            if (stock.getAvailableQty().compareTo(req.qty()) < 0) {
                throw new AppException(ErrorCode.BAD_REQUEST,
                        "Insufficient available stock: " + stock.getAvailableQty(), HttpStatus.BAD_REQUEST);
            }
            after = before.subtract(req.qty());
        }

        stock.setOnHandQty(after);
        recompute(stock);
        stockRepo.save(stock);

        var movement = movementRepo.save(StockMovement.builder()
                .product(product)
                .warehouse(warehouse)
                .movementType(isIn ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT")
                .qty(req.qty())
                .balanceBefore(before)
                .balanceAfter(after)
                .notes(req.notes())
                .performedBy(resolveUser(auth))
                .build());

        auditLogService.log(extractUserId(auth), "stock_movement", movement.getId(), "inventory_adjustment",
                (isIn ? "تسوية دخول مخزون — " : "تسوية خروج مخزون — ") + product.getName(),
                warehouse.getName(), "إدارة",
                Map.of(
                        "productId", product.getId(),
                        "productName", product.getName(),
                        "warehouseId", warehouse.getId(),
                        "warehouseName", warehouse.getName(),
                        "type", req.type(),
                        "qty", req.qty(),
                        "balanceBefore", before,
                        "balanceAfter", after,
                        "notes", req.notes() != null ? req.notes() : ""
                ));

        return StockMovementResponse.from(movement);
    }

    @Transactional
    public List<StockMovementResponse> transfer(StockTransferRequest req, Authentication auth) {
        if (req.fromWarehouseId().equals(req.toWarehouseId())) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "لا يمكن التحويل إلى نفس المستودع", HttpStatus.BAD_REQUEST);
        }

        var product = productRepo.findById(req.productId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Product not found", HttpStatus.NOT_FOUND));
        var fromWarehouse = warehouseRepo.findById(req.fromWarehouseId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Source warehouse not found", HttpStatus.NOT_FOUND));
        var toWarehouse = warehouseRepo.findById(req.toWarehouseId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Destination warehouse not found", HttpStatus.NOT_FOUND));

        var sourceStock = stockRepo.findForUpdate(req.productId(), req.fromWarehouseId())
                .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST,
                        "لا يوجد مخزون للصنف في المستودع المصدر", HttpStatus.BAD_REQUEST));

        BigDecimal sourceAvailable = safe(sourceStock.getAvailableQty());
        if (sourceAvailable.compareTo(req.qty()) < 0) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "الكمية أكبر من المتاح للتحويل: " + sourceAvailable, HttpStatus.BAD_REQUEST);
        }

        var targetStock = stockRepo.findForUpdate(req.productId(), req.toWarehouseId())
                .orElseGet(() -> ProductStock.builder()
                        .product(product)
                        .warehouse(toWarehouse)
                        .build());

        Long userId = extractUserId(auth);
        var user = userId != null ? userRepo.getReferenceById(userId) : null;

        BigDecimal sourceBefore = safe(sourceStock.getOnHandQty());
        BigDecimal sourceAfter = sourceBefore.subtract(req.qty());
        sourceStock.setOnHandQty(sourceAfter);
        recompute(sourceStock);
        stockRepo.save(sourceStock);

        BigDecimal targetBefore = safe(targetStock.getOnHandQty());
        BigDecimal targetAfter = targetBefore.add(req.qty());
        targetStock.setOnHandQty(targetAfter);
        recompute(targetStock);
        stockRepo.save(targetStock);

        var movements = new ArrayList<StockMovement>();
        var outMovement = movementRepo.save(StockMovement.builder()
                .product(product)
                .warehouse(fromWarehouse)
                .movementType("TRANSFER_OUT")
                .qty(req.qty())
                .balanceBefore(sourceBefore)
                .balanceAfter(sourceAfter)
                .sourceType("stock_transfer")
                .notes(req.notes())
                .performedBy(user)
                .build());
        movements.add(outMovement);
        movements.add(movementRepo.save(StockMovement.builder()
                .product(product)
                .warehouse(toWarehouse)
                .movementType("TRANSFER_IN")
                .qty(req.qty())
                .balanceBefore(targetBefore)
                .balanceAfter(targetAfter)
                .sourceType("stock_transfer")
                .sourceId(outMovement.getId())
                .notes(req.notes())
                .performedBy(user)
                .build()));

        auditLogService.log(userId, "stock_movement", outMovement.getId(), "stock_transfer",
                "تحويل مخزون — " + product.getName(),
                fromWarehouse.getName() + " → " + toWarehouse.getName(), "إدارة",
                Map.of(
                        "productId", product.getId(),
                        "productName", product.getName(),
                        "fromWarehouseId", fromWarehouse.getId(),
                        "fromWarehouseName", fromWarehouse.getName(),
                        "toWarehouseId", toWarehouse.getId(),
                        "toWarehouseName", toWarehouse.getName(),
                        "qty", req.qty(),
                        "notes", req.notes() != null ? req.notes() : ""
                ));

        return movements.stream().map(StockMovementResponse::from).toList();
    }

    private com.allalarticle.backend.users.entity.TenantUser resolveUser(Authentication auth) {
        if (auth instanceof UsernamePasswordAuthenticationToken t
                && t.getDetails() instanceof Claims claims) {
            Long userId = claims.get("userId", Long.class);
            if (userId != null) return userRepo.getReferenceById(userId);
        }
        return null;
    }

    private Long extractUserId(Authentication auth) {
        if (auth instanceof UsernamePasswordAuthenticationToken t
                && t.getDetails() instanceof Claims claims) {
            return claims.get("userId", Long.class);
        }
        return null;
    }

    private BigDecimal safe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private void ensureStockRows(Long warehouseId) {
        var products = productRepo.findByDeletedAtIsNull(Pageable.unpaged()).getContent();
        if (products.isEmpty()) return;

        List<Warehouse> warehouses = warehouseId != null
                ? List.of(warehouseRepo.findById(warehouseId)
                        .filter(Warehouse::isActive)
                        .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Warehouse not found", HttpStatus.NOT_FOUND)))
                : warehouseRepo.findByActiveTrueOrderByNameAsc();
        if (warehouses.isEmpty()) {
            warehouses = List.of(warehouseService.ensureDefaultWarehouse());
        }

        for (var warehouse : warehouses) {
            for (var product : products) {
                if (stockRepo.findForUpdate(product.getId(), warehouse.getId()).isEmpty()) {
                    stockRepo.save(ProductStock.builder()
                            .product(product)
                            .warehouse(warehouse)
                            .onHandQty(BigDecimal.ZERO)
                            .reservedQty(BigDecimal.ZERO)
                            .pendingQty(BigDecimal.ZERO)
                            .availableQty(BigDecimal.ZERO)
                            .projectedQty(BigDecimal.ZERO)
                            .lastRecomputedAt(OffsetDateTime.now())
                            .build());
                }
            }
        }
    }

    private void ensureStockRowsForProduct(Long productId) {
        var product = productRepo.findById(productId)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Product not found", HttpStatus.NOT_FOUND));
        var warehouses = warehouseRepo.findByActiveTrueOrderByNameAsc();
        if (warehouses.isEmpty()) {
            warehouses = List.of(warehouseService.ensureDefaultWarehouse());
        }
        for (var warehouse : warehouses) {
            if (stockRepo.findForUpdate(product.getId(), warehouse.getId()).isEmpty()) {
                stockRepo.save(ProductStock.builder()
                        .product(product)
                        .warehouse(warehouse)
                        .onHandQty(BigDecimal.ZERO)
                        .reservedQty(BigDecimal.ZERO)
                        .pendingQty(BigDecimal.ZERO)
                        .availableQty(BigDecimal.ZERO)
                        .projectedQty(BigDecimal.ZERO)
                        .lastRecomputedAt(OffsetDateTime.now())
                        .build());
            }
        }
    }

    private void recompute(ProductStock stock) {
        BigDecimal available = safe(stock.getOnHandQty()).subtract(safe(stock.getReservedQty()));
        stock.setAvailableQty(available);
        stock.setProjectedQty(available.add(safe(stock.getPendingQty())));
        stock.setLastRecomputedAt(OffsetDateTime.now());
    }
}
