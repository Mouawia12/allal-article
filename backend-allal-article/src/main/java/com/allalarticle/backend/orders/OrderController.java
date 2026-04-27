package com.allalarticle.backend.orders;

import com.allalarticle.backend.common.response.ApiResponse;
import com.allalarticle.backend.common.response.PageResponse;
import com.allalarticle.backend.orders.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'orders.view')")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(orderService.list(status, customerId, pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'orders.view')")
    public ResponseEntity<ApiResponse<OrderResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getById(id)));
    }

    @GetMapping("/{id}/events")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'orders.view')")
    public ResponseEntity<ApiResponse<List<OrderEventResponse>>> events(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getEvents(id)));
    }

    @PostMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'orders.create')")
    public ResponseEntity<ApiResponse<OrderResponse>> create(
            @Valid @RequestBody CreateOrderRequest req, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Order created", orderService.create(req, auth)));
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'orders.create')")
    public ResponseEntity<ApiResponse<OrderResponse>> submit(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.submit(id, auth)));
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'orders.confirm')")
    public ResponseEntity<ApiResponse<OrderResponse>> confirm(
            @PathVariable Long id,
            @RequestBody(required = false) ConfirmOrderRequest req,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.confirm(id, req, auth)));
    }

    @PostMapping("/{id}/ship")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'orders.ship')")
    public ResponseEntity<ApiResponse<OrderResponse>> ship(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.ship(id, auth)));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'orders.confirm')")
    public ResponseEntity<ApiResponse<OrderResponse>> complete(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.complete(id, auth)));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'orders.cancel')")
    public ResponseEntity<ApiResponse<OrderResponse>> cancel(
            @PathVariable Long id,
            @RequestBody(required = false) TransitionRequest req,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.cancel(id, req, auth)));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'orders.confirm')")
    public ResponseEntity<ApiResponse<OrderResponse>> reject(
            @PathVariable Long id,
            @RequestBody(required = false) TransitionRequest req,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.reject(id, req, auth)));
    }
}
