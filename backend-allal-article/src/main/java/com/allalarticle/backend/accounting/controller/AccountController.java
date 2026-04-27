package com.allalarticle.backend.accounting.controller;

import com.allalarticle.backend.accounting.dto.AccountRequest;
import com.allalarticle.backend.accounting.dto.AccountResponse;
import com.allalarticle.backend.accounting.service.AccountService;
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
@RequestMapping("/api/accounting/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService service;

    @GetMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'accounting.view')")
    public ResponseEntity<ApiResponse<List<AccountResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(service.findAll()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'accounting.view')")
    public ResponseEntity<ApiResponse<AccountResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.findById(id)));
    }

    @PostMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'accounting.manage')")
    public ResponseEntity<ApiResponse<AccountResponse>> create(@Valid @RequestBody AccountRequest req, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(service.create(req, extractUserId(auth))));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'accounting.manage')")
    public ResponseEntity<ApiResponse<AccountResponse>> update(@PathVariable Long id, @Valid @RequestBody AccountRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'accounting.manage')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    private Long extractUserId(Authentication auth) {
        if (auth instanceof UsernamePasswordAuthenticationToken t && t.getDetails() instanceof Claims claims) {
            return claims.get("userId", Long.class);
        }
        return null;
    }
}
