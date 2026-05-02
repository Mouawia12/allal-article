package com.allalarticle.backend.email;

import com.allalarticle.backend.common.response.ApiResponse;
import com.allalarticle.backend.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/settings/email-notifications")
@RequiredArgsConstructor
public class EmailSettingsController {

    private final EmailSettingsService settingsService;
    private final EmailNotificationService notificationService;
    private final JdbcTemplate jdbc;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> get() {
        EmailNotificationSettings s = settingsService.load();
        return ResponseEntity.ok(ApiResponse.ok(toMap(s)));
    }

    @PutMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> save(@RequestBody EmailNotificationSettings body) {
        EmailNotificationSettings saved = settingsService.save(body);
        return ResponseEntity.ok(ApiResponse.ok("تم حفظ إعدادات إشعارات البريد", toMap(saved)));
    }

    @PostMapping("/test")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendTest(@RequestBody(required = false) Map<String, Object> body) {
        String schema = TenantContext.get();
        if (!TenantContext.isValidSchema(schema)) {
            return ResponseEntity.badRequest().body(ApiResponse.ok("لا يوجد سياق مؤسسة", Map.of()));
        }

        EmailNotificationSettings settings = settingsService.load();
        List<String> recipients = settingsService.resolveTestRecipients(settings, schema);
        if (recipients.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.ok(
                    "لا يوجد مستخدمون نشطون أو عناوين إضافية لإرسال الاختبار", Map.of("sent", false)));
        }

        String html = """
            <!DOCTYPE html><html dir="rtl"><body style="font-family:Cairo,Arial,sans-serif;background:#f4f6fb;padding:24px;">
            <div style="max-width:540px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;box-shadow:0 6px 24px rgba(0,0,0,0.06);text-align:center;">
                <div style="font-size:48px;">✉️</div>
                <h2 style="margin:8px 0;color:#1f2d3d;">رسالة تجريبية</h2>
                <p style="color:#67748e;font-size:14px;line-height:1.7;">
                    هذه رسالة اختبار من نظام ALLAL لإدارة الأصناف.<br/>
                    إذا وصلتك هذه الرسالة فإن إعدادات البريد تعمل بشكل صحيح.
                </p>
                <p style="color:#8392ab;font-size:11px;margin-top:18px;">عدد المستلمين: %d</p>
            </div></body></html>
            """.formatted(recipients.size());

        Long outboxId = notificationService.persistOutbox(schema, "email.test",
                "رسالة اختبار — ALLAL", recipients, html, Map.of("test", true));
        notificationService.sendAsync(schema, outboxId,
                "رسالة اختبار — ALLAL", recipients, html, null, null);

        return ResponseEntity.ok(ApiResponse.ok("تم إرسال رسالة الاختبار",
                Map.of("sent", true, "recipientCount", recipients.size(), "mode", "all_active_users")));
    }

    @GetMapping("/outbox")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> listOutbox(
            @RequestParam(defaultValue = "20") int limit) {
        String schema = TenantContext.get();
        if (!TenantContext.isValidSchema(schema)) {
            return ResponseEntity.ok(ApiResponse.ok(List.of()));
        }
        if (!notificationService.hasOutboxTable(schema)) {
            return ResponseEntity.ok(ApiResponse.ok(List.of()));
        }
        List<Map<String, Object>> rows = jdbc.queryForList(String.format("""
                SELECT id, event_code AS "eventCode", subject, status, attempts,
                       error_message AS "errorMessage",
                       to_char(sent_at AT TIME ZONE 'Africa/Algiers', 'YYYY-MM-DD HH24:MI') AS "sentAt",
                       to_char(created_at AT TIME ZONE 'Africa/Algiers', 'YYYY-MM-DD HH24:MI') AS "createdAt",
                       jsonb_array_length(recipients_json) AS "recipientCount"
                FROM "%s".email_outbox
                ORDER BY created_at DESC
                LIMIT ?
                """, schema), Math.min(Math.max(limit, 1), 100));
        return ResponseEntity.ok(ApiResponse.ok(rows));
    }

    private Map<String, Object> toMap(EmailNotificationSettings s) {
        Map<String, Object> events = new HashMap<>();
        events.put("productCreated",      s.getEvents().isProductCreated());
        events.put("productPriceChanged", s.getEvents().isProductPriceChanged());
        events.put("productLowStock",     s.getEvents().isProductLowStock());
        events.put("bulkImportCompleted", s.getEvents().isBulkImportCompleted());

        Map<String, Object> map = new HashMap<>();
        map.put("enabled",                  s.isEnabled());
        map.put("recipientUserIds",         s.getRecipientUserIds());
        map.put("extraEmails",              s.getExtraEmails());
        map.put("events",                   events);
        map.put("bulkAttachThresholdRows",  s.getBulkAttachThresholdRows());
        return map;
    }
}
