package com.allalarticle.backend.email;

import com.allalarticle.backend.tenant.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailSettingsService {

    public static final String SETTING_KEY = "notifications.email";

    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public EmailNotificationSettings load() {
        return loadForSchema(requireSchema());
    }

    @Transactional(readOnly = true)
    public EmailNotificationSettings loadForSchema(String schema) {
        try {
            String json = jdbc.queryForObject(
                    String.format("SELECT value_json::text FROM \"%s\".settings WHERE key = ?", schema),
                    String.class, SETTING_KEY);
            if (json == null || json.isBlank()) return new EmailNotificationSettings();
            return objectMapper.readValue(json, EmailNotificationSettings.class);
        } catch (EmptyResultDataAccessException e) {
            return new EmailNotificationSettings();
        } catch (Exception e) {
            log.warn("Failed to read email notification settings for schema {}: {}", schema, e.getMessage());
            return new EmailNotificationSettings();
        }
    }

    @Transactional
    public EmailNotificationSettings save(EmailNotificationSettings settings) {
        String s = requireSchema();
        try {
            String json = objectMapper.writeValueAsString(settings);
            jdbc.update(String.format("""
                INSERT INTO "%s".settings (key, group_name, value_json)
                VALUES (?, 'notifications', ?::jsonb)
                ON CONFLICT (key) DO UPDATE
                    SET value_json = EXCLUDED.value_json,
                        updated_at = now()
                """, s), SETTING_KEY, json);
            return settings;
        } catch (Exception e) {
            log.error("Failed to save email notification settings: {}", e.getMessage());
            throw new IllegalStateException("تعذر حفظ إعدادات إشعارات البريد", e);
        }
    }

    /**
     * Resolve concrete email addresses for the current tenant: explicit user IDs + extra emails.
     * De-duplicated, preserving insertion order.
     */
    @Transactional(readOnly = true)
    public List<String> resolveRecipients(EmailNotificationSettings settings, String schema) {
        Set<String> emails = new LinkedHashSet<>();

        if (settings.getRecipientUserIds() != null && !settings.getRecipientUserIds().isEmpty()) {
            String inClause = settings.getRecipientUserIds().stream()
                    .map(id -> "?")
                    .reduce((a, b) -> a + "," + b)
                    .orElse("NULL");
            List<String> rows = jdbc.queryForList(String.format("""
                    SELECT email FROM "%s".users
                    WHERE id IN (%s) AND deleted_at IS NULL AND status = 'active'
                    """, schema, inClause),
                    String.class,
                    settings.getRecipientUserIds().toArray());
            emails.addAll(rows);
        }

        if (settings.getExtraEmails() != null) {
            for (String e : settings.getExtraEmails()) {
                if (e != null && e.contains("@")) emails.add(e.trim());
            }
        }

        return new ArrayList<>(emails);
    }

    /**
     * Test email should reach everyone relevant: all active tenant users plus extra emails.
     * Regular notifications still use resolveRecipients so production events stay configurable.
     */
    @Transactional(readOnly = true)
    public List<String> resolveTestRecipients(EmailNotificationSettings settings, String schema) {
        Set<String> emails = new LinkedHashSet<>();

        List<String> users = jdbc.queryForList(String.format("""
                SELECT email FROM "%s".users
                WHERE deleted_at IS NULL
                  AND status = 'active'
                  AND email IS NOT NULL
                  AND email <> ''
                ORDER BY id
                """, schema), String.class);
        emails.addAll(users);

        if (settings.getExtraEmails() != null) {
            for (String e : settings.getExtraEmails()) {
                if (e != null && e.contains("@")) emails.add(e.trim());
            }
        }

        return new ArrayList<>(emails);
    }

    private String requireSchema() {
        String schema = TenantContext.get();
        if (!TenantContext.isValidSchema(schema)) {
            throw new IllegalStateException("No tenant context");
        }
        return schema;
    }
}
