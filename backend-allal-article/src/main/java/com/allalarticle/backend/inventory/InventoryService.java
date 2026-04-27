package com.allalarticle.backend.inventory;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.common.response.PageResponse;
import com.allalarticle.backend.inventory.dto.*;
import com.allalarticle.backend.inventory.entity.ProductStock;
import com.allalarticle.backend.inventory.entity.StockMovement;
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
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final ProductStockRepository stockRepo;
    private final StockMovementRepository movementRepo;
    private final ProductRepository productRepo;
    private final WarehouseRepository warehouseRepo;
    private final TenantUserRepository userRepo;

    @Transactional(readOnly = true)
    public PageResponse<StockSummaryResponse> listStock(Long warehouseId, Pageable pageable) {
        var page = warehouseId != null
                ? stockRepo.findByWarehouseId(warehouseId, pageable)
                : stockRepo.findAll(pageable);
        return PageResponse.from(page.map(StockSummaryResponse::from));
    }

    @Transactional(readOnly = true)
    public List<StockSummaryResponse> getProductStock(Long productId) {
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
        stock.setAvailableQty(req.qty());
        stock.setLastRecomputedAt(OffsetDateTime.now());
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
        stock.setAvailableQty(after.subtract(stock.getReservedQty()));
        stock.setLastRecomputedAt(OffsetDateTime.now());
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

        return StockMovementResponse.from(movement);
    }

    private com.allalarticle.backend.users.entity.TenantUser resolveUser(Authentication auth) {
        if (auth instanceof UsernamePasswordAuthenticationToken t
                && t.getDetails() instanceof Claims claims) {
            Long userId = claims.get("userId", Long.class);
            if (userId != null) return userRepo.getReferenceById(userId);
        }
        return null;
    }
}
