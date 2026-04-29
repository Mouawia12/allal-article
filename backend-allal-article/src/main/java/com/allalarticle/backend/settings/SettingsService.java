package com.allalarticle.backend.settings;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.tenant.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SettingsService {

    private final JdbcTemplate  jdbc;
    private final ObjectMapper  objectMapper;

    private static final String COMPANY_KEY = "company.profile";

    // ── Company Profile ───────────────────────────────────────────────────────

    public Map<String, Object> getCompanyProfile() {
        String s = TenantContext.get();
        if (s == null || s.isBlank()) throw new IllegalStateException("No tenant context");

        try {
            String json = jdbc.queryForObject(
                    String.format("SELECT value_json::text FROM \"%s\".settings WHERE key = ?", s),
                    String.class, COMPANY_KEY);
            if (json == null) return new HashMap<>();
            @SuppressWarnings("unchecked")
            Map<String, Object> result = objectMapper.readValue(json, Map.class);
            return result;
        } catch (EmptyResultDataAccessException e) {
            return new HashMap<>();
        } catch (Exception e) {
            log.warn("Failed to read company profile: {}", e.getMessage());
            throw new AppException(
                    ErrorCode.INTERNAL_ERROR,
                    "تعذر تحميل ملف الشركة",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public void saveCompanyProfile(Map<String, Object> data) {
        String s = TenantContext.get();
        if (s == null || s.isBlank()) throw new IllegalStateException("No tenant context");
        try {
            String json = objectMapper.writeValueAsString(data);
            jdbc.update(String.format("""
                INSERT INTO "%s".settings (key, group_name, value_json)
                VALUES (?, 'company', ?::jsonb)
                ON CONFLICT (key) DO UPDATE
                    SET value_json = EXCLUDED.value_json,
                        updated_at = now()
                """, s), COMPANY_KEY, json);
        } catch (Exception e) {
            log.warn("Failed to save company profile: {}", e.getMessage());
            throw new AppException(
                    ErrorCode.INTERNAL_ERROR,
                    "تعذر حفظ ملف الشركة",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
