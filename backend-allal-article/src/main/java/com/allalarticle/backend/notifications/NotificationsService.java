package com.allalarticle.backend.notifications;

import com.allalarticle.backend.tenant.TenantContext;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class NotificationsService {

    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    public record NotificationRequest(
            String category,
            String severity,
            String title,
            String body,
            String entityType,
            Long entityId,
            Long actorUserId,
            String sourceEventCode,
            String actionUrl,
            String reasonText,
            String recipientReason,
            Map<String, Object> payload,
            String dedupeKey,
            String groupKey
    ) {
        public NotificationRequest {
            category = normalize(category, "system");
            severity = normalize(severity, "info");
            title = normalize(title, "إشعار جديد");
            recipientReason = normalize(recipientReason, "لأن هذا الحدث يخص نشاط النظام داخل مؤسستك.");
        }

        private static String normalize(String value, String fallback) {
            return value != null && !value.isBlank() ? value : fallback;
        }
    }

    @Transactional
    public Long publishToActiveUsers(NotificationRequest request) {
        String s = requireTenantSchema();
        Set<Long> recipientIds = new LinkedHashSet<>(jdbc.queryForList(String.format("""
                SELECT id
                FROM "%s".users
                WHERE status = 'active' AND deleted_at IS NULL
                ORDER BY id
                """, s), Long.class));

        if (request.actorUserId() != null) {
            recipientIds.add(request.actorUserId());
        }

        return publishToUsers(request, recipientIds);
    }

    @Transactional
    public Long publishToUsers(NotificationRequest request, Collection<Long> recipientUserIds) {
        String s = requireTenantSchema();
        Set<Long> recipientIds = new LinkedHashSet<>();
        if (recipientUserIds != null) {
            recipientUserIds.stream()
                    .filter(id -> id != null && id > 0)
                    .forEach(recipientIds::add);
        }
        if (request.actorUserId() != null && request.actorUserId() > 0) {
            recipientIds.add(request.actorUserId());
        }
        if (recipientIds.isEmpty()) return null;

        Long notificationId = jdbc.queryForObject(String.format("""
                INSERT INTO "%s".notifications
                    (category, severity, title, body, entity_type, entity_id,
                     source_type, source_id, actor_user_id, source_event_code,
                     action_url, reason_text, summary_text, payload_json, dedupe_key, group_key)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?)
                RETURNING id
                """, s), Long.class,
                request.category(),
                request.severity(),
                request.title(),
                request.body(),
                request.entityType(),
                request.entityId(),
                request.entityType(),
                request.entityId(),
                request.actorUserId(),
                request.sourceEventCode(),
                request.actionUrl(),
                request.reasonText(),
                request.title(),
                toJson(request.payload()),
                request.dedupeKey(),
                request.groupKey());

        if (notificationId == null) return null;

        String insertRecipientSql = String.format("""
                INSERT INTO "%s".notification_recipients
                    (notification_id, recipient_user_id, delivery_status, state, recipient_reason)
                VALUES (?, ?, 'delivered', 'new', ?)
                ON CONFLICT (notification_id, recipient_user_id)
                DO UPDATE SET
                    delivery_status = 'delivered',
                    recipient_reason = EXCLUDED.recipient_reason
                """, s);
        for (Long recipientId : recipientIds) {
            jdbc.update(insertRecipientSql, notificationId, recipientId, request.recipientReason());
        }
        return notificationId;
    }

    public Map<String, Object> listForUser(Long userId, String filter, int page, int size) {
        String s = requireTenantSchema();

        StringBuilder where = new StringBuilder(
                "WHERE nr.recipient_user_id = ? AND nr.is_archived = false");
        List<Object> params = new ArrayList<>();
        params.add(userId);

        if ("unread".equals(filter)) {
            where.append(" AND nr.is_read = false");
        } else if ("critical".equals(filter)) {
            where.append(" AND n.severity IN ('critical','action_required')");
        } else if ("action".equals(filter)) {
            where.append(" AND n.status = 'active' AND nr.state NOT IN ('actioned','archived')");
        } else if ("snoozed".equals(filter)) {
            where.append(" AND nr.state = 'snoozed'");
        } else if ("escalated".equals(filter)) {
            where.append(" AND nr.state = 'escalated'");
        }

        Long total = jdbc.queryForObject(
                String.format("""
                    SELECT count(*)
                    FROM "%s".notifications n
                    JOIN "%s".notification_recipients nr ON nr.notification_id = n.id
                    %s
                    """, s, s, where),
                Long.class, params.toArray());

        List<Object> dataParams = new ArrayList<>(params);
        dataParams.add(size);
        dataParams.add((long) page * size);

        List<Map<String, Object>> rows = jdbc.queryForList(
                String.format("""
                    SELECT
                        n.id,
                        n.public_id      AS "publicId",
                        n.category,
                        n.severity,
                        n.title,
                        n.body,
                        n.entity_type    AS "entityType",
                        n.entity_id      AS "entityId",
                        n.action_url     AS "actionUrl",
                        n.reason_text    AS reason,
                        n.summary_text   AS "summaryText",
                        nr.is_read       AS "isRead",
                        nr.delivery_status AS "deliveryStatus",
                        nr.state,
                        nr.snoozed_until AS "snoozedUntil",
                        nr.recipient_reason AS "recipientReason",
                        to_char(n.created_at AT TIME ZONE 'Africa/Algiers', 'YYYY-MM-DD HH24:MI') AS "createdAt",
                        u.name           AS actor
                    FROM "%s".notifications n
                    JOIN "%s".notification_recipients nr ON nr.notification_id = n.id
                    LEFT JOIN "%s".users u ON u.id = n.actor_user_id
                    %s
                    ORDER BY n.created_at DESC
                    LIMIT ? OFFSET ?
                    """, s, s, s, where),
                dataParams.toArray());

        // Compute stats
        long unread = rows.stream().filter(r -> Boolean.FALSE.equals(r.get("isRead"))).count();
        long critical = rows.stream()
                .filter(r -> "critical".equals(r.get("severity")) || "action_required".equals(r.get("severity")))
                .count();
        long escalated = rows.stream().filter(r -> "escalated".equals(r.get("state"))).count();

        return Map.of(
                "content",       rows,
                "totalElements", total != null ? total : 0L,
                "page",          page,
                "size",          size,
                "totalPages",    total != null ? (int) Math.ceil((double) total / size) : 0,
                "stats", Map.of(
                        "total",     total != null ? total : 0L,
                        "unread",    unread,
                        "critical",  critical,
                        "escalated", escalated
                )
        );
    }

    public void markRead(Long notificationId, Long userId) {
        String s = requireTenantSchema();
        jdbc.update(String.format("""
            UPDATE "%s".notification_recipients
            SET is_read = true, read_at = now(), state = CASE WHEN state IN ('new', 'delivered') THEN 'read' ELSE state END
            WHERE notification_id = ? AND recipient_user_id = ?
            """, s), notificationId, userId);
    }

    public void markAllRead(Long userId) {
        String s = requireTenantSchema();
        jdbc.update(String.format("""
            UPDATE "%s".notification_recipients
            SET is_read = true, read_at = now(), state = CASE WHEN state IN ('new', 'delivered') THEN 'read' ELSE state END
            WHERE recipient_user_id = ? AND is_read = false
            """, s), userId);
    }

    private String requireTenantSchema() {
        String schema = TenantContext.get();
        if (!TenantContext.isValidSchema(schema)) {
            throw new IllegalStateException("No tenant context");
        }
        return schema;
    }

    private String toJson(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload != null ? payload : Map.of());
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Invalid notification payload", e);
        }
    }
}
