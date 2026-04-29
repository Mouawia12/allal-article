package com.allalarticle.backend.platform;

import com.allalarticle.backend.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Platform-level API — requires ROLE_PLATFORM_OWNER authority (owner JWT token).
 */
@RestController
@RequestMapping("/api/platform")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_PLATFORM_OWNER','ROLE_PLATFORM_SUPPORT')")
public class PlatformController {

    private final PlatformService platformService;

    // ─── Stats ───────────────────────────────────────────────────────────────
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String,Object>>> getStats() {
        return ResponseEntity.ok(ApiResponse.ok(platformService.getStats()));
    }

    // ─── Tenants ─────────────────────────────────────────────────────────────
    @GetMapping("/tenants")
    public ResponseEntity<ApiResponse<List<Map<String,Object>>>> listTenants(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(ApiResponse.ok(platformService.listTenants(status, search)));
    }

    @GetMapping("/tenants/{id}")
    public ResponseEntity<ApiResponse<Map<String,Object>>> getTenant(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(platformService.getTenant(id)));
    }

    @PostMapping("/tenants")
    @PreAuthorize("hasAuthority('ROLE_PLATFORM_OWNER')")
    public ResponseEntity<ApiResponse<Map<String,Object>>> createTenant(
            @RequestBody Map<String,String> body) {
        return ResponseEntity.ok(ApiResponse.ok(platformService.createTenant(body)));
    }

    @PatchMapping("/tenants/{id}/reset-password")
    @PreAuthorize("hasAuthority('ROLE_PLATFORM_OWNER')")
    public ResponseEntity<ApiResponse<Void>> resetOwnerPassword(
            @PathVariable Long id,
            @RequestBody Map<String,String> body) {
        platformService.resetOwnerPassword(id, body.get("newPassword"));
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PatchMapping("/tenants/{id}/status")
    @PreAuthorize("hasAuthority('ROLE_PLATFORM_OWNER')")
    public ResponseEntity<ApiResponse<Void>> updateTenantStatus(
            @PathVariable Long id,
            @RequestBody Map<String,String> body) {
        platformService.updateTenantStatus(id, body.get("status"), body.get("reason"));
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // ─── Plans ───────────────────────────────────────────────────────────────
    @GetMapping("/plans")
    public ResponseEntity<ApiResponse<List<Map<String,Object>>>> listPlans() {
        return ResponseEntity.ok(ApiResponse.ok(platformService.listPlans()));
    }

    @PatchMapping("/plans/{id}")
    @PreAuthorize("hasAuthority('ROLE_PLATFORM_OWNER')")
    public ResponseEntity<ApiResponse<Void>> updatePlan(
            @PathVariable Long id,
            @RequestBody Map<String,Object> body) {
        platformService.updatePlan(id, body);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // ─── Revenue ─────────────────────────────────────────────────────────────
    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<Map<String,Object>>> getRevenue() {
        return ResponseEntity.ok(ApiResponse.ok(platformService.getRevenue()));
    }

    // ─── Provisioning Events ─────────────────────────────────────────────────
    @GetMapping("/events")
    public ResponseEntity<ApiResponse<List<Map<String,Object>>>> listEvents(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(ApiResponse.ok(platformService.listEvents(limit)));
    }
}
