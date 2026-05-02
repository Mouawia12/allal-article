package com.allalarticle.backend.accounting.controller;

import com.allalarticle.backend.accounting.dto.JournalRequest;
import com.allalarticle.backend.accounting.dto.JournalResponse;
import com.allalarticle.backend.accounting.service.JournalService;
import com.allalarticle.backend.common.response.ApiResponse;
import com.allalarticle.backend.common.response.PageResponse;
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
@RequestMapping("/api/accounting/journals")
@RequiredArgsConstructor
public class JournalController {

    private final JournalService service;

    @GetMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'accounting.view')")
    public ResponseEntity<ApiResponse<PageResponse<JournalResponse>>> list(
            @RequestParam(required = false) Long fiscalYearId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("journalDate").descending());
        var journals = fiscalYearId != null
                ? service.findByFiscalYear(fiscalYearId, pageable)
                : service.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.from(journals)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'accounting.view')")
    public ResponseEntity<ApiResponse<JournalResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.findById(id)));
    }

    @PostMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'accounting.journals.create')")
    public ResponseEntity<ApiResponse<JournalResponse>> create(@Valid @RequestBody JournalRequest req, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(service.create(req, extractUserId(auth))));
    }

    @PostMapping("/{id}/post")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'accounting.journals.post')")
    public ResponseEntity<ApiResponse<JournalResponse>> post(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(service.post(id, extractUserId(auth))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'accounting.journals.create')")
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
