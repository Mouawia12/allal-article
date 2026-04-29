package com.allalarticle.backend.notifications;

import com.allalarticle.backend.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationsService {

    private final JdbcTemplate jdbc;

    public Map<String, Object> listForUser(Long userId, String filter, int page, int size) {
        String s = TenantContext.get();
        if (s == null || s.isBlank()) throw new IllegalStateException("No tenant context");

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
        String s = TenantContext.get();
        if (s == null || s.isBlank()) return;
        jdbc.update(String.format("""
            UPDATE "%s".notification_recipients
            SET is_read = true, read_at = now(), state = CASE WHEN state = 'new' THEN 'read' ELSE state END
            WHERE notification_id = ? AND recipient_user_id = ?
            """, s), notificationId, userId);
    }

    public void markAllRead(Long userId) {
        String s = TenantContext.get();
        if (s == null || s.isBlank()) return;
        jdbc.update(String.format("""
            UPDATE "%s".notification_recipients
            SET is_read = true, read_at = now(), state = CASE WHEN state = 'new' THEN 'read' ELSE state END
            WHERE recipient_user_id = ? AND is_read = false
            """, s), userId);
    }
}
