package com.allalarticle.backend.products;

import com.allalarticle.backend.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/price-lists")
@RequiredArgsConstructor
public class PriceListController {

    private final PriceListService priceListService;

    @GetMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'products.view')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(priceListService.listAll()));
    }

    @GetMapping("/{id}/items")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'products.view')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> items(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(priceListService.listItems(id)));
    }

    @GetMapping("/{id}/assignments")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'products.view')")
    public ResponseEntity<ApiResponse<List<Long>>> assignments(
            @PathVariable Long id,
            @RequestParam String entityType) {
        return ResponseEntity.ok(ApiResponse.ok(priceListService.listAssignedIds(id, entityType)));
    }

    @PostMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'products.create')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> create(@RequestBody Map<String, Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(priceListService.create(body)));
    }

    @PutMapping("/{listId}/items/{productId}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'products.edit')")
    public ResponseEntity<ApiResponse<Void>> upsertItem(
            @PathVariable Long listId,
            @PathVariable Long productId,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        Object priceVal = body.get("unitPrice");
        BigDecimal price = priceVal != null && !priceVal.toString().isBlank()
                ? new BigDecimal(priceVal.toString()) : BigDecimal.ZERO;
        priceListService.upsertItem(listId, productId, price, auth);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @DeleteMapping("/{listId}/items/{productId}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'products.edit')")
    public ResponseEntity<ApiResponse<Void>> removeItem(
            @PathVariable Long listId,
            @PathVariable Long productId) {
        priceListService.removeItem(listId, productId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PutMapping("/{id}/assignments")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'products.edit')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> saveAssignments(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        String entityType = String.valueOf(body.getOrDefault("entityType", ""));
        Object rawIds = body.get("entityIds");
        List<Long> entityIds = rawIds instanceof List<?> values
                ? values.stream()
                    .filter(v -> v != null && !v.toString().isBlank())
                    .map(v -> Long.valueOf(v.toString()))
                    .toList()
                : List.of();
        return ResponseEntity.ok(ApiResponse.ok(
                "Price list assignments saved",
                priceListService.saveAssignments(id, entityType, entityIds)));
    }
}
