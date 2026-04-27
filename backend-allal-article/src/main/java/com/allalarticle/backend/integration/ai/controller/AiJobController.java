package com.allalarticle.backend.integration.ai.controller;

import com.allalarticle.backend.common.response.ApiResponse;
import com.allalarticle.backend.common.response.PageResponse;
import com.allalarticle.backend.integration.ai.dto.AiJobRequest;
import com.allalarticle.backend.integration.ai.dto.AiJobResponse;
import com.allalarticle.backend.integration.ai.service.AiJobService;
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
@RequestMapping("/api/ai-jobs")
@RequiredArgsConstructor
public class AiJobController {

    private final AiJobService service;

    @GetMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'ai.view')")
    public ResponseEntity<ApiResponse<PageResponse<AiJobResponse>>> list(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.from(service.list(status, pageable))));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'ai.view')")
    public ResponseEntity<ApiResponse<AiJobResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.findById(id)));
    }

    @PostMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'ai.create')")
    public ResponseEntity<ApiResponse<AiJobResponse>> create(
            @Valid @RequestBody AiJobRequest req, Authentication auth) {
        var job = service.create(req, extractUserId(auth));
        service.processJob(job.id());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(job));
    }

    @PutMapping("/{jobId}/items/{itemId}/decision")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'ai.review')")
    public ResponseEntity<ApiResponse<AiJobResponse>> updateDecision(
            @PathVariable Long jobId,
            @PathVariable Long itemId,
            @RequestParam String decision) {
        return ResponseEntity.ok(ApiResponse.ok(service.updateItemDecision(jobId, itemId, decision)));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'ai.create')")
    public ResponseEntity<ApiResponse<AiJobResponse>> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.cancel(id)));
    }

    private Long extractUserId(Authentication auth) {
        if (auth instanceof UsernamePasswordAuthenticationToken t && t.getDetails() instanceof Claims claims) {
            return claims.get("userId", Long.class);
        }
        return null;
    }
}
