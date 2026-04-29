package com.allalarticle.backend.platform;

import com.allalarticle.backend.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Publicly accessible endpoints — no authentication required.
 * Exposes only read-only data safe for unauthenticated callers (landing page, etc.).
 */
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final PlatformService platformService;

    @GetMapping("/plans")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPublicPlans() {
        return ResponseEntity.ok(ApiResponse.ok(platformService.getPublicPlans()));
    }
}
