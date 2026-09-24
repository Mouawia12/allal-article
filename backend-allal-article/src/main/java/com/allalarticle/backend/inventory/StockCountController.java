package com.allalarticle.backend.inventory;

import com.allalarticle.backend.common.response.ApiResponse;
import com.allalarticle.backend.common.response.PageResponse;
import com.allalarticle.backend.inventory.dto.StockCountEntryRequest;
import com.allalarticle.backend.inventory.dto.StockCountRequest;
import com.allalarticle.backend.inventory.dto.StockCountResponse;
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
@RequestMapping("/api/inventory/counts")
@RequiredArgsConstructor
public class StockCountController {

    private final StockCountService service;

    @GetMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'inventory.view')")
    public ResponseEntity<ApiResponse<PageResponse<StockCountResponse>>> list(
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(ApiResponse.ok(service.list(warehouseId, status, pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'inventory.view')")
    public ResponseEntity<ApiResponse<StockCountResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.get(id)));
    }

    @PostMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'inventory.count')")
    public ResponseEntity<ApiResponse<StockCountResponse>> open(
            @Valid @RequestBody StockCountRequest req, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("تم فتح الجرد", service.open(req, auth)));
    }

    @PostMapping("/{id}/entries")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'inventory.count')")
    public ResponseEntity<ApiResponse<StockCountResponse>> recordEntries(
            @PathVariable Long id,
            @Valid @RequestBody List<StockCountEntryRequest> entries,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(service.recordEntries(id, entries, auth)));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'inventory.count')")
    public ResponseEntity<ApiResponse<StockCountResponse>> close(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("تم إقفال العدّ للمراجعة", service.closeForReview(id, auth)));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'inventory.count.approve')")
    public ResponseEntity<ApiResponse<StockCountResponse>> approve(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("تم اعتماد الجرد", service.approve(id, auth)));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'inventory.count')")
    public ResponseEntity<ApiResponse<StockCountResponse>> cancel(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("تم إلغاء الجرد", service.cancel(id, auth)));
    }
}
