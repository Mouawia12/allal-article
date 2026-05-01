package com.allalarticle.backend.purchases;

import com.allalarticle.backend.common.response.ApiResponse;
import com.allalarticle.backend.common.response.PageResponse;
import com.allalarticle.backend.purchases.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/purchases")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService poService;

    @GetMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'purchases.view')")
    public ResponseEntity<ApiResponse<PageResponse<PurchaseOrderResponse>>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(poService.list(status, supplierId,
                PageRequest.of(page, size, Sort.by("createdAt").descending()))));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'purchases.view')")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(poService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'purchases.create')")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> create(
            @Valid @RequestBody CreatePurchaseOrderRequest req, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Purchase order created", poService.create(req, auth)));
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'purchases.confirm')")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> confirm(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(poService.confirm(id, auth)));
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'purchases.receive')")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> receive(
            @PathVariable Long id,
            @RequestBody(required = false) ReceivePurchaseRequest req,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(poService.receive(id, req != null ? req : new ReceivePurchaseRequest(null, null, null), auth)));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'purchases.cancel')")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> cancel(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(poService.cancel(id, auth)));
    }

    @PostMapping("/{id}/return")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'purchases.receive')")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> registerReturn(
            @PathVariable Long id,
            @Valid @RequestBody CreatePurchaseReturnRequest req,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Purchase return posted", poService.registerReturn(id, req, auth)));
    }
}
