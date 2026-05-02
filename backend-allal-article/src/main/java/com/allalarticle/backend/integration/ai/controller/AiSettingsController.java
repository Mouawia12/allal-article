package com.allalarticle.backend.integration.ai.controller;

import com.allalarticle.backend.common.response.ApiResponse;
import com.allalarticle.backend.integration.ai.dto.AiConnectionTestRequest;
import com.allalarticle.backend.integration.ai.dto.AiConnectionTestResponse;
import com.allalarticle.backend.integration.ai.dto.AiModelsRefreshRequest;
import com.allalarticle.backend.integration.ai.dto.AiModelsRefreshResponse;
import com.allalarticle.backend.integration.ai.dto.AiSettingsRequest;
import com.allalarticle.backend.integration.ai.dto.AiSettingsResponse;
import com.allalarticle.backend.integration.ai.service.AiSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings/ai")
@RequiredArgsConstructor
public class AiSettingsController {

    private final AiSettingsService service;

    @GetMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'settings.ai')")
    public ResponseEntity<ApiResponse<AiSettingsResponse>> get() {
        return ResponseEntity.ok(ApiResponse.ok(service.getSettings()));
    }

    @PutMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'settings.ai')")
    public ResponseEntity<ApiResponse<AiSettingsResponse>> save(@RequestBody AiSettingsRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("تم حفظ إعدادات الذكاء الاصطناعي", service.save(request)));
    }

    @PostMapping("/test")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'settings.ai')")
    public ResponseEntity<ApiResponse<AiConnectionTestResponse>> test(@RequestBody(required = false) AiConnectionTestRequest request) {
        AiConnectionTestRequest safeRequest = request != null ? request : new AiConnectionTestRequest(null, null, null);
        return ResponseEntity.ok(ApiResponse.ok("تم اختبار اتصال OpenAI", service.testConnection(safeRequest)));
    }

    @PostMapping("/models/refresh")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'settings.ai')")
    public ResponseEntity<ApiResponse<AiModelsRefreshResponse>> refreshModels(
            @RequestBody(required = false) AiModelsRefreshRequest request) {
        AiModelsRefreshRequest safeRequest = request != null ? request : new AiModelsRefreshRequest(null);
        return ResponseEntity.ok(ApiResponse.ok("تم تحديث قائمة موديلات OpenAI", service.refreshOpenAiModels(safeRequest)));
    }
}
