package com.allalarticle.backend.manufacturing.controller;

import com.allalarticle.backend.common.response.ApiResponse;
import com.allalarticle.backend.common.response.PageResponse;
import com.allalarticle.backend.manufacturing.dto.*;
import com.allalarticle.backend.manufacturing.entity.ManufacturingEvent;
import com.allalarticle.backend.manufacturing.entity.ManufacturingQualityCheck;
import com.allalarticle.backend.manufacturing.service.ManufacturingService;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manufacturing")
@RequiredArgsConstructor
public class ManufacturingController {

    private final ManufacturingService service;

    @GetMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'manufacturing.view')")
    public ResponseEntity<ApiResponse<PageResponse<ManufacturingRequestResponse>>> list(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.from(service.list(status, pageable))));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'manufacturing.view')")
    public ResponseEntity<ApiResponse<ManufacturingRequestResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.findById(id)));
    }

    @GetMapping("/{id}/events")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'manufacturing.view')")
    public ResponseEntity<ApiResponse<List<ManufacturingEvent>>> events(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getEvents(id)));
    }

    @GetMapping("/{id}/quality-checks")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'manufacturing.view')")
    public ResponseEntity<ApiResponse<List<ManufacturingQualityCheck>>> qualityChecks(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getQualityChecks(id)));
    }

    @PostMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'manufacturing.create')")
    public ResponseEntity<ApiResponse<ManufacturingRequestResponse>> create(
            @Valid @RequestBody ManufacturingRequestRequest req, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(service.create(req, extractUserId(auth))));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'manufacturing.approve')")
    public ResponseEntity<ApiResponse<ManufacturingRequestResponse>> approve(
            @PathVariable Long id, @Valid @RequestBody ApproveRequest req, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(service.approve(id, req, extractUserId(auth))));
    }

    @PostMapping("/{id}/start-production")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'manufacturing.manage')")
    public ResponseEntity<ApiResponse<ManufacturingRequestResponse>> startProduction(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(service.startProduction(id, extractUserId(auth))));
    }

    @PostMapping("/{id}/quality-check")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'manufacturing.manage')")
    public ResponseEntity<ApiResponse<ManufacturingRequestResponse>> qualityCheck(
            @PathVariable Long id, @Valid @RequestBody QualityCheckRequest req, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(service.submitQualityCheck(id, req, extractUserId(auth))));
    }

    @PostMapping("/{id}/ready-to-ship")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'manufacturing.manage')")
    public ResponseEntity<ApiResponse<ManufacturingRequestResponse>> readyToShip(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(service.markReadyToShip(id, extractUserId(auth))));
    }

    @PostMapping("/{id}/ship")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'manufacturing.manage')")
    public ResponseEntity<ApiResponse<ManufacturingRequestResponse>> ship(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(service.ship(id, extractUserId(auth))));
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'manufacturing.receive')")
    public ResponseEntity<ApiResponse<ManufacturingRequestResponse>> receive(
            @PathVariable Long id, @Valid @RequestBody ReceiveManufacturingRequest req, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(service.receive(id, req, extractUserId(auth))));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'manufacturing.manage')")
    public ResponseEntity<ApiResponse<ManufacturingRequestResponse>> cancel(
            @PathVariable Long id,
            @RequestParam(required = false) String reason,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(service.cancel(id, reason, extractUserId(auth))));
    }

    private Long extractUserId(Authentication auth) {
        if (auth instanceof UsernamePasswordAuthenticationToken t && t.getDetails() instanceof Claims claims) {
            return claims.get("userId", Long.class);
        }
        return null;
    }
}
