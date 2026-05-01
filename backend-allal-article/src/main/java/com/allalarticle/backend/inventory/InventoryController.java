package com.allalarticle.backend.inventory;

import com.allalarticle.backend.common.response.ApiResponse;
import com.allalarticle.backend.common.response.PageResponse;
import com.allalarticle.backend.inventory.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/stock")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'inventory.view')")
    public ResponseEntity<ApiResponse<PageResponse<StockSummaryResponse>>> listStock(
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.listStock(warehouseId, pageable)));
    }

    @GetMapping("/stock/product/{productId}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'inventory.view')")
    public ResponseEntity<ApiResponse<List<StockSummaryResponse>>> getProductStock(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getProductStock(productId)));
    }

    @GetMapping("/movements")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'inventory.view')")
    public ResponseEntity<ApiResponse<PageResponse<StockMovementResponse>>> movements(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.listMovements(productId, warehouseId, pageable)));
    }

    @PostMapping("/stock/initial")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'inventory.adjust')")
    public ResponseEntity<ApiResponse<StockSummaryResponse>> setInitialStock(
            @Valid @RequestBody InitialStockRequest req,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.setInitialStock(req, auth)));
    }

    @PostMapping("/stock/adjust")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'inventory.adjust')")
    public ResponseEntity<ApiResponse<StockMovementResponse>> adjust(
            @Valid @RequestBody StockAdjustmentRequest req,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.adjust(req, auth)));
    }

    @PostMapping("/stock/transfer")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'inventory.transfer')")
    public ResponseEntity<ApiResponse<List<StockMovementResponse>>> transfer(
            @Valid @RequestBody StockTransferRequest req,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.transfer(req, auth)));
    }
}
