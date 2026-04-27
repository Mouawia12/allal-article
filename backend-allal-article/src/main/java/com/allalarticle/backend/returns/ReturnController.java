package com.allalarticle.backend.returns;

import com.allalarticle.backend.common.response.ApiResponse;
import com.allalarticle.backend.common.response.PageResponse;
import com.allalarticle.backend.returns.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/returns")
@RequiredArgsConstructor
public class ReturnController {

    private final ReturnService returnService;

    @GetMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'returns.view')")
    public ResponseEntity<ApiResponse<PageResponse<ReturnResponse>>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(returnService.list(status, customerId,
                PageRequest.of(page, size, Sort.by("createdAt").descending()))));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'returns.view')")
    public ResponseEntity<ApiResponse<ReturnResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(returnService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'returns.create')")
    public ResponseEntity<ApiResponse<ReturnResponse>> create(
            @Valid @RequestBody CreateReturnRequest req, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Return created", returnService.create(req, auth)));
    }

    @PostMapping("/{id}/accept")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'returns.accept')")
    public ResponseEntity<ApiResponse<ReturnResponse>> accept(
            @PathVariable Long id,
            @RequestBody(required = false) AcceptReturnRequest req,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(returnService.accept(id, req, auth)));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'returns.accept')")
    public ResponseEntity<ApiResponse<ReturnResponse>> reject(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(returnService.reject(id, auth)));
    }
}
