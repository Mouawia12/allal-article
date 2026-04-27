package com.allalarticle.backend.accounting.controller;

import com.allalarticle.backend.accounting.dto.FiscalYearRequest;
import com.allalarticle.backend.accounting.dto.FiscalYearResponse;
import com.allalarticle.backend.accounting.service.FiscalYearService;
import com.allalarticle.backend.common.response.ApiResponse;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounting/fiscal-years")
@RequiredArgsConstructor
public class FiscalYearController {

    private final FiscalYearService service;

    @GetMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'accounting.view')")
    public ResponseEntity<ApiResponse<List<FiscalYearResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(service.findAll()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'accounting.view')")
    public ResponseEntity<ApiResponse<FiscalYearResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.findById(id)));
    }

    @PostMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'accounting.manage')")
    public ResponseEntity<ApiResponse<FiscalYearResponse>> create(@Valid @RequestBody FiscalYearRequest req, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(service.create(req, extractUserId(auth))));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'accounting.manage')")
    public ResponseEntity<ApiResponse<FiscalYearResponse>> close(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(service.close(id, extractUserId(auth))));
    }

    private Long extractUserId(Authentication auth) {
        if (auth instanceof UsernamePasswordAuthenticationToken t && t.getDetails() instanceof Claims claims) {
            return claims.get("userId", Long.class);
        }
        return null;
    }
}
