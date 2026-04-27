package com.allalarticle.backend.returns;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.common.response.PageResponse;
import com.allalarticle.backend.customers.CustomerRepository;
import com.allalarticle.backend.inventory.ProductStockRepository;
import com.allalarticle.backend.inventory.StockMovementRepository;
import com.allalarticle.backend.inventory.WarehouseRepository;
import com.allalarticle.backend.inventory.entity.ProductStock;
import com.allalarticle.backend.inventory.entity.StockMovement;
import com.allalarticle.backend.orders.OrderRepository;
import com.allalarticle.backend.orders.OrderItemRepository;
import com.allalarticle.backend.products.ProductRepository;
import com.allalarticle.backend.returns.dto.*;
import com.allalarticle.backend.returns.entity.Return;
import com.allalarticle.backend.returns.entity.ReturnItem;
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
import java.time.Year;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReturnService {

    private final ReturnRepository returnRepo;
    private final OrderRepository orderRepo;
    private final OrderItemRepository orderItemRepo;
    private final CustomerRepository customerRepo;
    private final ProductRepository productRepo;
    private final WarehouseRepository warehouseRepo;
    private final ProductStockRepository stockRepo;
    private final StockMovementRepository movementRepo;

    @Transactional(readOnly = true)
    public PageResponse<ReturnResponse> list(String status, Long customerId, Pageable pageable) {
        var page = status != null ? returnRepo.findByStatus(status, pageable)
                : customerId != null ? returnRepo.findByCustomerId(customerId, pageable)
                : returnRepo.findAll(pageable);
        return PageResponse.from(page.map(ReturnResponse::from));
    }

    @Transactional(readOnly = true)
    public ReturnResponse getById(Long id) {
        return returnRepo.findById(id).map(ReturnResponse::from)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Return not found", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public ReturnResponse create(CreateReturnRequest req, Authentication auth) {
        Long userId = extractUserId(auth);
        var ret = Return.builder()
                .returnNumber("TEMP")
                .returnDate(req.returnDate())
                .notes(req.notes())
                .createdById(userId)
                .build();

        if (req.orderId() != null) ret.setOrder(orderRepo.findById(req.orderId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Order not found", HttpStatus.NOT_FOUND)));
        if (req.customerId() != null) ret.setCustomer(customerRepo.findById(req.customerId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Customer not found", HttpStatus.NOT_FOUND)));

        var saved = returnRepo.save(ret);
        saved.setReturnNumber("RET-" + Year.now() + "-" + String.format("%06d", saved.getId()));

        for (var r : req.items()) {
            var product = productRepo.findById(r.productId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Product not found", HttpStatus.NOT_FOUND));
            var item = ReturnItem.builder()
                    .returnEntity(saved)
                    .product(product)
                    .returnedQty(r.qty())
                    .conditionStatus(r.conditionStatus())
                    .notes(r.notes())
                    .build();
            if (r.orderItemId() != null) item.setOrderItem(orderItemRepo.findById(r.orderItemId()).orElse(null));
            saved.getItems().add(item);
        }

        return ReturnResponse.from(returnRepo.save(saved));
    }

    @Transactional
    public ReturnResponse accept(Long id, AcceptReturnRequest req, Authentication auth) {
        var ret = requireStatus(id, "pending");
        Long userId = extractUserId(auth);

        var warehouseOpt = req != null && req.warehouseId() != null
                ? warehouseRepo.findById(req.warehouseId())
                : warehouseRepo.findByIsDefaultTrue();
        var warehouse = warehouseOpt.orElseThrow(
                () -> new AppException(ErrorCode.NOT_FOUND, "Warehouse not found", HttpStatus.NOT_FOUND));

        Map<Long, BigDecimal> qtyMap = (req != null && req.acceptedQtyByItemId() != null)
                ? req.acceptedQtyByItemId() : Map.of();

        for (var item : ret.getItems()) {
            BigDecimal accepted = qtyMap.getOrDefault(item.getId(), item.getReturnedQty())
                    .min(item.getReturnedQty());
            item.setAcceptedQty(accepted);

            if (accepted.compareTo(BigDecimal.ZERO) > 0) {
                var stock = stockRepo.findForUpdate(item.getProduct().getId(), warehouse.getId())
                        .orElseGet(() -> ProductStock.builder()
                                .product(item.getProduct()).warehouse(warehouse).build());
                BigDecimal before = stock.getOnHandQty();
                BigDecimal after  = before.add(accepted);
                stock.setOnHandQty(after);
                stock.setAvailableQty(after.subtract(stock.getReservedQty()));
                stock.setLastRecomputedAt(OffsetDateTime.now());
                stockRepo.save(stock);

                movementRepo.save(StockMovement.builder()
                        .product(item.getProduct())
                        .warehouse(warehouse)
                        .movementType("RETURN_IN")
                        .qty(accepted)
                        .balanceBefore(before)
                        .balanceAfter(after)
                        .sourceType("return")
                        .sourceId(ret.getId())
                        .build());

                // Update order_item.returned_qty if linked
                if (item.getOrderItem() != null) {
                    var oi = item.getOrderItem();
                    oi.setReturnedQty(oi.getReturnedQty().add(accepted));
                    orderItemRepo.save(oi);
                }
            }
        }

        ret.setStatus("accepted");
        ret.setReceivedById(userId);
        return ReturnResponse.from(returnRepo.save(ret));
    }

    @Transactional
    public ReturnResponse reject(Long id, Authentication auth) {
        var ret = requireStatus(id, "pending");
        ret.setStatus("rejected");
        return ReturnResponse.from(returnRepo.save(ret));
    }

    private Return requireStatus(Long id, String... allowed) {
        var ret = returnRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Return not found", HttpStatus.NOT_FOUND));
        for (var s : allowed) if (s.equals(ret.getStatus())) return ret;
        throw new AppException(ErrorCode.BAD_REQUEST,
                "Invalid transition from status: " + ret.getStatus(), HttpStatus.BAD_REQUEST);
    }

    private Long extractUserId(Authentication auth) {
        if (auth instanceof UsernamePasswordAuthenticationToken t
                && t.getDetails() instanceof Claims c) return c.get("userId", Long.class);
        return null;
    }
}
