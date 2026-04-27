package com.allalarticle.backend.documents.controller;

import com.allalarticle.backend.common.response.ApiResponse;
import com.allalarticle.backend.common.response.PageResponse;
import com.allalarticle.backend.documents.dto.RoadInvoiceRequest;
import com.allalarticle.backend.documents.dto.RoadInvoiceResponse;
import com.allalarticle.backend.documents.service.RoadInvoiceService;
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

@RestController
@RequestMapping("/api/road-invoices")
@RequiredArgsConstructor
public class RoadInvoiceController {

    private final RoadInvoiceService service;

    @GetMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'road_invoices.view')")
    public ResponseEntity<ApiResponse<PageResponse<RoadInvoiceResponse>>> list(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("invoiceDate").descending());
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.from(service.list(status, pageable))));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'road_invoices.view')")
    public ResponseEntity<ApiResponse<RoadInvoiceResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.findById(id)));
    }

    @PostMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'road_invoices.create')")
    public ResponseEntity<ApiResponse<RoadInvoiceResponse>> create(
            @Valid @RequestBody RoadInvoiceRequest req, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(service.create(req, extractUserId(auth))));
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'road_invoices.create')")
    public ResponseEntity<ApiResponse<RoadInvoiceResponse>> confirm(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.confirm(id)));
    }

    @PostMapping("/{id}/print")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'road_invoices.view')")
    public ResponseEntity<ApiResponse<RoadInvoiceResponse>> print(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(service.recordPrint(id, extractUserId(auth))));
    }

    @PostMapping("/{id}/whatsapp")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'road_invoices.view')")
    public ResponseEntity<ApiResponse<RoadInvoiceResponse>> whatsapp(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.recordWhatsapp(id)));
    }

    @PutMapping("/wilaya-defaults/{wilayaId}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'road_invoices.create')")
    public ResponseEntity<ApiResponse<Void>> setWilayaDefault(
            @PathVariable Long wilayaId,
            @RequestParam Long customerId,
            Authentication auth) {
        service.setWilayaDefault(wilayaId, customerId, extractUserId(auth));
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    private Long extractUserId(Authentication auth) {
        if (auth instanceof UsernamePasswordAuthenticationToken t && t.getDetails() instanceof Claims claims) {
            return claims.get("userId", Long.class);
        }
        return null;
    }
}
