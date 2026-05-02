package com.allalarticle.backend.accounting.controller;

import com.allalarticle.backend.common.response.ApiResponse;
import com.allalarticle.backend.tenant.TenantContext;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounting/settings")
@RequiredArgsConstructor
public class AccountingSettingsController {

    private final JdbcTemplate jdbc;

    @GetMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'accounting.view')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> list() {
        String schema = TenantContext.get();
        TenantContext.requireValidSchema(schema);
        return ResponseEntity.ok(ApiResponse.ok(jdbc.queryForList(String.format("""
                select s.key,
                       s.account_id as "accountId",
                       s.label,
                       s.group_name as "group",
                       s.is_required as "required",
                       s.allowed_classification as "allowedClassification",
                       s.requires_control as "requiresControl",
                       a.code as "accountCode",
                       a.name_ar as "accountName"
                from "%1$s".accounting_settings s
                left join "%1$s".accounts a on a.id = s.account_id
                order by s.group_name, s.key
                """, schema))));
    }

    @PutMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'accounting.manage')")
    public ResponseEntity<ApiResponse<Void>> update(@RequestBody Map<String, Object> body, Authentication auth) {
        Object raw = body.getOrDefault("settings", body);
        if (raw instanceof Map<?, ?> settings) {
            String schema = TenantContext.get();
            TenantContext.requireValidSchema(schema);
            Long userId = extractUserId(auth);
            settings.forEach((key, value) -> {
                if (key == null) return;
                Long accountId = value == null || "".equals(value) ? null : Long.valueOf(String.valueOf(value));
                jdbc.update(String.format("""
                        update "%1$s".accounting_settings
                        set account_id = ?, updated_by = ?, updated_at = now()
                        where key = ?
                        """, schema), accountId, userId, String.valueOf(key));
            });
        }
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    private Long extractUserId(Authentication auth) {
        if (auth instanceof UsernamePasswordAuthenticationToken t && t.getDetails() instanceof Claims claims) {
            return claims.get("userId", Long.class);
        }
        return null;
    }
}
