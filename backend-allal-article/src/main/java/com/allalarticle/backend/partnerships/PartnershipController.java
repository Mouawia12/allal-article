package com.allalarticle.backend.partnerships;

import com.allalarticle.backend.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/partnerships")
@RequiredArgsConstructor
public class PartnershipController {

    private final PartnershipService partnershipService;

    @GetMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'partners.view')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> summary() {
        return ResponseEntity.ok(ApiResponse.ok(partnershipService.summary()));
    }

    @PostMapping("/invite-codes")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'partners.manage')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createInviteCode(
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.ok(partnershipService.createInviteCode(body)));
    }

    @PostMapping("/requests")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'partners.manage')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitRequest(
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.ok(partnershipService.submitRequest(body)));
    }

    @PostMapping("/requests/{id}/approve")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'partners.manage')")
    public ResponseEntity<ApiResponse<Void>> approveRequest(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        partnershipService.approveRequest(id, body);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/requests/{id}/reject")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'partners.manage')")
    public ResponseEntity<ApiResponse<Void>> rejectRequest(@PathVariable Long id) {
        partnershipService.rejectRequest(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PatchMapping("/{id}/revoke")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'partners.manage')")
    public ResponseEntity<ApiResponse<Void>> revokePartnership(@PathVariable Long id) {
        partnershipService.revokePartnership(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PatchMapping("/{id}/permissions")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'partners.manage')")
    public ResponseEntity<ApiResponse<Void>> updatePermissions(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        partnershipService.updatePermissions(id, body);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/{partnerId}/inventory")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'partners.view')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> linkedInventory(@PathVariable String partnerId) {
        return ResponseEntity.ok(ApiResponse.ok(partnershipService.linkedInventory(partnerId)));
    }

    @PostMapping("/{partnerId}/products/clone")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'partners.manage')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cloneProducts(
            @PathVariable String partnerId,
            @RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.ok(partnershipService.cloneProducts(partnerId, body)));
    }
}
