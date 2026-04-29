package com.allalarticle.backend.settings;

import com.allalarticle.backend.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping("/company")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCompany() {
        return ResponseEntity.ok(ApiResponse.ok(settingsService.getCompanyProfile()));
    }

    @PutMapping("/company")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> saveCompany(@RequestBody Map<String, Object> body) {
        settingsService.saveCompanyProfile(body);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
