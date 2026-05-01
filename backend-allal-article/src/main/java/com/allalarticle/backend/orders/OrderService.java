package com.allalarticle.backend.orders;

import com.allalarticle.backend.audit.AuditLogService;
import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.common.response.PageResponse;
import com.allalarticle.backend.customers.CustomerRepository;
import com.allalarticle.backend.inventory.*;
import com.allalarticle.backend.inventory.entity.StockMovement;
import com.allalarticle.backend.inventory.entity.StockReservation;
import com.allalarticle.backend.orders.dto.*;
import com.allalarticle.backend.orders.entity.Order;
import com.allalarticle.backend.orders.entity.OrderEvent;
import com.allalarticle.backend.orders.entity.OrderItem;
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
import java.time.Year;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class OrderService {

    private static final Set<String> TERMINAL = Set.of("completed", "cancelled", "rejected");

    private final OrderRepository          orderRepo;
    private final OrderItemRepository      itemRepo;
    private final OrderEventRepository     eventRepo;
    private final ProductRepository        productRepo;
    private final CustomerRepository       customerRepo;
    private final TenantUserRepository     userRepo;
    private final WarehouseRepository      warehouseRepo;
    private final ProductStockRepository   stockRepo;
    private final StockMovementRepository  movementRepo;
    private final StockReservationRepository reservationRepo;
    private final AuditLogService          auditLogService;

    // ── Read ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> list(String status, Long customerId, Pageable pageable) {
        var page = (status != null && !status.isBlank())
                ? orderRepo.findByOrderStatusAndDeletedAtIsNull(status, pageable)
                : (customerId != null)
                    ? orderRepo.findByCustomerIdAndDeletedAtIsNull(customerId, pageable)
                    : orderRepo.findByDeletedAtIsNull(pageable);
        return PageResponse.from(page.map(OrderResponse::from));
    }

    @Transactional(readOnly = true)
    public OrderResponse getById(Long id) {
        return orderRepo.findById(id)
                .filter(o -> o.getDeletedAt() == null)
                .map(OrderResponse::from)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Order not found", HttpStatus.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public List<OrderEventResponse> getEvents(Long orderId) {
        return eventRepo.findByOrderIdOrderByCreatedAtDesc(orderId).stream()
                .map(OrderEventResponse::from).toList();
    }

    // ── Create ────────────────────────────────────────────────────────────────

    @Transactional
    public OrderResponse create(CreateOrderRequest req, Authentication auth) {
        Long userId = extractUserId(auth);

        var order = Order.builder()
                .orderNumber("TEMP")
                .createdById(userId)
                .notes(req.notes())
                .internalNotes(req.internalNotes())
                .build();

        if (req.customerId() != null) {
            order.setCustomer(customerRepo.findById(req.customerId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Customer not found", HttpStatus.NOT_FOUND)));
        }
        if (req.salesUserId() != null) {
            order.setSalesUser(userRepo.findById(req.salesUserId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Sales user not found", HttpStatus.NOT_FOUND)));
        }

        var saved = orderRepo.save(order);
        saved.setOrderNumber("ORD-" + Year.now() + "-" + String.format("%06d", saved.getId()));

        // Add items
        int lineNum = 1;
        for (var req2 : req.items()) {
            var product = productRepo.findById(req2.productId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Product not found", HttpStatus.NOT_FOUND));
            BigDecimal price = product.getCurrentPriceAmount() != null
                    ? product.getCurrentPriceAmount() : BigDecimal.ZERO;
            var item = OrderItem.builder()
                    .order(saved)
                    .product(product)
                    .lineNumber(lineNum++)
                    .requestedQty(req2.qty())
                    .approvedQty(req2.qty())
                    .cancelledQty(BigDecimal.ZERO)
                    .unitPrice(price)
                    .baseUnitPrice(price)
                    .lineSubtotal(price.multiply(req2.qty()))
                    .customerNote(req2.customerNote())
                    .build();
            saved.getItems().add(item);
        }

        recalculateTotal(saved);
        recordEvent(saved, "ORDER_CREATED", null, userId);
        return OrderResponse.from(orderRepo.save(saved));
    }

    // ── Transitions ───────────────────────────────────────────────────────────

    @Transactional
    public OrderResponse submit(Long orderId, Authentication auth) {
        var order = getOrderForUpdate(orderId);
        requireStatus(order, "draft");
        order.setOrderStatus("submitted");
        order.setShippingStatus("pending");
        order.setSubmittedAt(OffsetDateTime.now());
        recordEvent(order, "ORDER_SUBMITTED", null, extractUserId(auth));
        return OrderResponse.from(orderRepo.save(order));
    }

    @Transactional
    public OrderResponse startReview(Long orderId, Authentication auth) {
        var order = getOrderForUpdate(orderId);
        requireStatus(order, "submitted");
        Long userId = extractUserId(auth);

        order.setOrderStatus("under_review");
        order.setShippingStatus("pending");
        order.setReviewStartedAt(OffsetDateTime.now());
        order.setReviewedById(userId);
        recordEvent(order, "ORDER_REVIEW_STARTED", null, userId);
        return OrderResponse.from(orderRepo.save(order));
    }

    @Transactional
    public OrderResponse confirm(Long orderId, ConfirmOrderRequest req, Authentication auth) {
        var order = getOrderForUpdate(orderId);
        requireStatus(order, "under_review");
        Long userId = extractUserId(auth);

        // Apply approved quantities (full approval if no overrides provided)
        Map<Long, BigDecimal> overrides = req != null && req.approvedQtyByItemId() != null
                ? req.approvedQtyByItemId() : Map.of();

        for (var item : order.getItems()) {
            if (item.getDeletedAt() != null) continue;
            BigDecimal approved = overrides.getOrDefault(item.getId(), item.getRequestedQty());
            approved = approved.min(item.getRequestedQty());
            item.setApprovedQty(approved);
            item.setCancelledQty(item.getRequestedQty().subtract(approved));
            item.setLineStatus(approved.compareTo(BigDecimal.ZERO) == 0 ? "cancelled" : "approved");
            BigDecimal price = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
            item.setLineSubtotal(price.multiply(approved));
        }

        recalculateTotal(order);
        order.setOrderStatus("confirmed");
        order.setConfirmedAt(OffsetDateTime.now());
        order.setConfirmedById(userId);
        if (req != null && req.internalNotes() != null) order.setInternalNotes(req.internalNotes());

        // Estimate completion due date: 3 days after confirmation
        order.setCompletionDueAt(OffsetDateTime.now().plusDays(3));

        reserveStock(order);
        recordEvent(order, "ORDER_CONFIRMED", null, userId);
        return OrderResponse.from(orderRepo.save(order));
    }

    @Transactional
    public OrderResponse ship(Long orderId, Authentication auth) {
        var order = getOrderForUpdate(orderId);
        requireStatus(order, "confirmed");
        Long userId = extractUserId(auth);

        order.setOrderStatus("shipped");
        order.setShippingStatus("shipped");
        order.setShippedAt(OffsetDateTime.now());
        order.setShippedById(userId);

        for (var item : order.getItems()) {
            if (item.getDeletedAt() != null || "cancelled".equals(item.getLineStatus())) continue;
            item.setShippedQty(item.getApprovedQty());
            item.setLineStatus("shipped");
        }

        fulfillStock(order, userId);
        recordEvent(order, "ORDER_SHIPPED", null, userId);
        return OrderResponse.from(orderRepo.save(order));
    }

    @Transactional
    public OrderResponse complete(Long orderId, Authentication auth) {
        var order = getOrderForUpdate(orderId);
        requireStatus(order, "shipped");
        Long userId = extractUserId(auth);
        markCompleted(order, userId, false);
        recordEvent(order, "ORDER_COMPLETED", Map.of("manual", true), userId);
        return OrderResponse.from(orderRepo.save(order));
    }

    @Transactional
    public OrderResponse cancel(Long orderId, TransitionRequest req, Authentication auth) {
        var order = getOrderForUpdate(orderId);
        if (TERMINAL.contains(order.getOrderStatus())) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "Cannot cancel an order in status: " + order.getOrderStatus(), HttpStatus.BAD_REQUEST);
        }
        Long userId = extractUserId(auth);
        order.setOrderStatus("cancelled");
        order.setCancelledAt(OffsetDateTime.now());
        order.setCancelledById(userId);

        releaseStock(order);
        recordEvent(order, "ORDER_CANCELLED",
                req != null ? Map.of("reason", String.valueOf(req.reason())) : null, userId);
        return OrderResponse.from(orderRepo.save(order));
    }

    @Transactional
    public OrderResponse reject(Long orderId, TransitionRequest req, Authentication auth) {
        var order = getOrderForUpdate(orderId);
        requireStatus(order, "submitted", "under_review");
        Long userId = extractUserId(auth);
        order.setOrderStatus("rejected");
        order.setRejectedAt(OffsetDateTime.now());
        order.setRejectedById(userId);
        recordEvent(order, "ORDER_REJECTED",
                req != null ? Map.of("reason", String.valueOf(req.reason())) : null, userId);
        return OrderResponse.from(orderRepo.save(order));
    }

    // ── Auto-complete (called by scheduler) ───────────────────────────────────

    @Transactional
    public void autoCompleteShipped() {
        var cutoff = OffsetDateTime.now().minusDays(3);
        var orders = orderRepo.findShippedBefore(cutoff);
        for (var order : orders) {
            markCompleted(order, null, true);
            recordEvent(order, "ORDER_AUTO_COMPLETED", Map.of("auto", true), null);
            orderRepo.save(order);
        }
    }

    // ── Stock helpers ─────────────────────────────────────────────────────────

    private void reserveStock(Order order) {
        var warehouseOpt = warehouseRepo.findByIsDefaultTrue();
        if (warehouseOpt.isEmpty()) return;
        var warehouse = warehouseOpt.get();

        for (var item : order.getItems()) {
            if (item.getDeletedAt() != null || item.getApprovedQty().compareTo(BigDecimal.ZERO) == 0) continue;

            var stockOpt = stockRepo.findForUpdate(item.getProduct().getId(), warehouse.getId());
            if (stockOpt.isEmpty()) {
                throw new AppException(ErrorCode.CONFLICT,
                        "لا يوجد مخزون للصنف: " + item.getProduct().getName(), HttpStatus.CONFLICT);
            }
            var stock = stockOpt.get();
            BigDecimal available = safeStockValue(stock.getAvailableQty());

            if (available.compareTo(item.getApprovedQty()) < 0) {
                throw new AppException(ErrorCode.CONFLICT,
                        "المخزون غير كاف للصنف: " + item.getProduct().getName(), HttpStatus.CONFLICT);
            }

            stock.setReservedQty(stock.getReservedQty().add(item.getApprovedQty()));
            stock.setAvailableQty(stock.getOnHandQty().subtract(stock.getReservedQty()));
            stockRepo.save(stock);

            reservationRepo.save(StockReservation.builder()
                    .product(item.getProduct())
                    .warehouse(warehouse)
                    .orderId(order.getId())
                    .orderItemId(item.getId())
                    .reservedQty(item.getApprovedQty())
                    .build());
        }
    }

    private void releaseStock(Order order) {
        var reservations = reservationRepo.findByOrderIdAndStatus(order.getId(), "active");
        for (var res : reservations) {
            var stockOpt = stockRepo.findForUpdate(res.getProduct().getId(), res.getWarehouse().getId());
            if (stockOpt.isPresent()) {
                var stock = stockOpt.get();
                stock.setReservedQty(stock.getReservedQty().subtract(res.getReservedQty()).max(BigDecimal.ZERO));
                stock.setAvailableQty(stock.getOnHandQty().subtract(stock.getReservedQty()));
                stockRepo.save(stock);
            }
            res.setStatus("released");
            reservationRepo.save(res);
        }
    }

    private void fulfillStock(Order order, Long userId) {
        var reservations = reservationRepo.findByOrderIdAndStatus(order.getId(), "active");
        for (var res : reservations) {
            var stockOpt = stockRepo.findForUpdate(res.getProduct().getId(), res.getWarehouse().getId());
            if (stockOpt.isPresent()) {
                var stock = stockOpt.get();
                BigDecimal before = stock.getOnHandQty();
                BigDecimal after  = before.subtract(res.getReservedQty()).max(BigDecimal.ZERO);
                stock.setOnHandQty(after);
                stock.setReservedQty(stock.getReservedQty().subtract(res.getReservedQty()).max(BigDecimal.ZERO));
                stock.setAvailableQty(stock.getOnHandQty().subtract(stock.getReservedQty()));
                stockRepo.save(stock);

                movementRepo.save(StockMovement.builder()
                        .product(res.getProduct())
                        .warehouse(res.getWarehouse())
                        .movementType("SALE_OUT")
                        .qty(res.getReservedQty())
                        .balanceBefore(before)
                        .balanceAfter(after)
                        .sourceType("order")
                        .sourceId(order.getId())
                        .performedBy(userId != null ? userRepo.getReferenceById(userId) : null)
                        .build());
            }
            res.setStatus("fulfilled");
            reservationRepo.save(res);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Order getOrderForUpdate(Long id) {
        return orderRepo.findById(id)
                .filter(o -> o.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Order not found", HttpStatus.NOT_FOUND));
    }

    private void requireStatus(Order order, String... allowed) {
        for (var s : allowed) if (s.equals(order.getOrderStatus())) return;
        throw new AppException(ErrorCode.BAD_REQUEST,
                "Invalid transition from status: " + order.getOrderStatus(), HttpStatus.BAD_REQUEST);
    }

    private void recalculateTotal(Order order) {
        BigDecimal total = order.getItems().stream()
                .filter(i -> i.getDeletedAt() == null)
                .map(OrderItem::getLineSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        order.setTotalAmount(total);
    }

    private BigDecimal safeStockValue(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private void markCompleted(Order order, Long userId, boolean auto) {
        order.setOrderStatus("completed");
        order.setCompletedAt(OffsetDateTime.now());
        order.setCompletedById(userId);
        if (auto) order.setAutoCompletedAt(OffsetDateTime.now());
        order.getItems().stream()
                .filter(i -> i.getDeletedAt() == null && "shipped".equals(i.getLineStatus()))
                .forEach(i -> i.setLineStatus("completed"));
    }

    private static final Map<String, String[]> EVENT_TO_AUDIT = Map.of(
            "ORDER_CREATED",        new String[]{"create_order",   "إنشاء طلبية جديدة"},
            "ORDER_SUBMITTED",      new String[]{"submit_order",   "إرسال الطلبية للمراجعة"},
            "ORDER_REVIEW_STARTED", new String[]{"review_order",   "تسجيل الطلبية قيد المراجعة"},
            "ORDER_CONFIRMED",      new String[]{"confirm_order",  "تأكيد الطلبية"},
            "ORDER_REJECTED",       new String[]{"reject_order",   "رفض الطلبية"},
            "ORDER_SHIPPED",        new String[]{"ship_order",     "شحن الطلبية"},
            "ORDER_COMPLETED",      new String[]{"complete_order", "إنجاز الطلبية"},
            "ORDER_AUTO_COMPLETED", new String[]{"complete_order", "إنجاز الطلبية تلقائياً"},
            "ORDER_CANCELLED",      new String[]{"cancel_order",   "إلغاء الطلبية"}
    );

    private void recordEvent(Order order, String type, Map<String, Object> payload, Long userId) {
        eventRepo.save(OrderEvent.builder()
                .order(order)
                .eventType(type)
                .payloadJson(payload)
                .performedById(userId)
                .build());

        var audit = EVENT_TO_AUDIT.get(type);
        if (audit != null) {
            String entityDisplay = order.getOrderNumber() != null ? order.getOrderNumber() : "ORD-?";
            String customerName  = order.getCustomer() != null ? order.getCustomer().getName() : null;
            String description   = audit[1] + (customerName != null ? " — " + customerName : "");
            auditLogService.log(userId, "order", order.getId(), audit[0],
                    description, entityDisplay, "إدارة",
                    payload != null ? payload : Map.of());
        }
    }

    private Long extractUserId(Authentication auth) {
        if (auth instanceof UsernamePasswordAuthenticationToken t
                && t.getDetails() instanceof Claims claims) {
            return claims.get("userId", Long.class);
        }
        return null;
    }
}
