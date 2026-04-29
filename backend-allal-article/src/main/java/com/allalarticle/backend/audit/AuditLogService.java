package com.allalarticle.backend.audit;

import com.allalarticle.backend.tenant.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    // ── Write ─────────────────────────────────────────────────────────────────

    public void log(Long actorUserId, String entityType, Long entityId,
                    String action, String description, String entityDisplay,
                    String actorRole, Map<String, Object> details) {
        String s = TenantContext.get();
        if (s == null || s.isBlank()) return;
        try {
            String metaJson = objectMapper.writeValueAsString(Map.of(
                    "description", description != null ? description : "",
                    "entity",      entityDisplay != null ? entityDisplay : "",
                    "role",        actorRole != null ? actorRole : "",
                    "details",     details != null ? details : Map.of()
            ));
            jdbc.update(
                    String.format("""
                        INSERT INTO "%s".audit_logs
                            (actor_user_id, entity_type, entity_id, action, meta_json)
                        VALUES (?, ?, ?, ?, ?::jsonb)
                        """, s),
                    actorUserId, entityType, entityId, action, metaJson);
        } catch (Exception e) {
            log.warn("Failed to write audit log: {}", e.getMessage());
        }
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    public Map<String, Object> list(String search, String entityType,
                                     String action, String from, String to,
                                     int page, int size) {
        String s = TenantContext.get();
        if (s == null || s.isBlank()) throw new IllegalStateException("No tenant context");

        StringBuilder where = new StringBuilder("WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (action != null && !action.isBlank()) {
            where.append(" AND al.action = ?");
            params.add(action);
        }
        if (entityType != null && !entityType.isBlank()) {
            where.append(" AND al.entity_type = ?");
            params.add(entityType);
        }
        if (search != null && !search.isBlank()) {
            where.append(" AND (al.action ILIKE ? OR al.meta_json::text ILIKE ?)");
            String like = "%" + search + "%";
            params.add(like);
            params.add(like);
        }
        if (from != null && !from.isBlank()) {
            where.append(" AND al.created_at >= ?::timestamptz");
            params.add(from);
        }
        if (to != null && !to.isBlank()) {
            where.append(" AND al.created_at < (?::date + interval '1 day')");
            params.add(to);
        }

        Long total = jdbc.queryForObject(
                String.format("SELECT count(*) FROM \"%s\".audit_logs al %s", s, where),
                Long.class, params.toArray());

        List<Object> dataParams = new ArrayList<>(params);
        dataParams.add(size);
        dataParams.add((long) page * size);

        List<Map<String, Object>> rows = jdbc.queryForList(
                String.format("""
                    SELECT
                        al.id,
                        to_char(al.created_at AT TIME ZONE 'Africa/Algiers', 'YYYY-MM-DD HH24:MI') AS time,
                        COALESCE(u.name, 'النظام') AS "user",
                        COALESCE(al.meta_json->>'role', 'نظام')        AS role,
                        al.action,
                        al.entity_type,
                        al.entity_id,
                        COALESCE(al.meta_json->>'entity', al.entity_type) AS entity,
                        COALESCE(al.meta_json->>'description', al.action) AS description,
                        COALESCE(al.meta_json->'details', '{}')::text     AS details_json
                    FROM "%s".audit_logs al
                    LEFT JOIN "%s".users u ON u.id = al.actor_user_id
                    %s
                    ORDER BY al.created_at DESC
                    LIMIT ? OFFSET ?
                    """, s, s, where),
                dataParams.toArray());

        return Map.of(
                "content",       rows,
                "totalElements", total != null ? total : 0L,
                "page",          page,
                "size",          size,
                "totalPages",    total != null ? (int) Math.ceil((double) total / size) : 0
        );
    }
}
