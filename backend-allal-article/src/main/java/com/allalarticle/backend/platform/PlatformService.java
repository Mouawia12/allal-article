package com.allalarticle.backend.platform;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlatformService {

    private final JdbcTemplate jdbc;
    private final TenantSchemaService tenantSchemaService;
    private final PasswordEncoder passwordEncoder;

    // ─── Stats ────────────────────────────────────────────────────────────────
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("totalTenants",    count("select count(*) from platform.tenants"));
        stats.put("activeTenants",   count("select count(*) from platform.tenants where status='active'"));
        stats.put("trialTenants",    count("select count(*) from platform.tenants where status='trial'"));
        stats.put("suspendedTenants",count("select count(*) from platform.tenants where status='suspended'"));

        // MRR (Monthly Recurring Revenue) from active subscriptions
        Double mrr = jdbc.queryForObject(
            """
            select coalesce(sum(s.price_monthly), 0)
            from platform.subscriptions s
            where s.status = 'active'
            """, Double.class);
        stats.put("mrr", mrr != null ? mrr : 0.0);

        // New tenants this month
        stats.put("newThisMonth", count(
            "select count(*) from platform.tenants where date_trunc('month', created_at) = date_trunc('month', now())"));

        // Plans distribution
        List<Map<String, Object>> planDist = jdbc.queryForList(
            """
            select p.name_ar, p.code, count(t.id) as tenant_count
            from platform.plans p
            left join platform.tenants t on t.plan_id = p.id and t.status not in ('cancelled')
            group by p.id, p.name_ar, p.code
            order by p.sort_order
            """);
        stats.put("planDistribution", planDist);

        return stats;
    }

    // ─── Tenants ──────────────────────────────────────────────────────────────
    public List<Map<String, Object>> listTenants(String status, String search) {
        StringBuilder sql = new StringBuilder("""
            select t.id, t.public_id, t.schema_name, t.company_name, t.contact_email,
                   t.contact_phone, t.wilaya_code, t.status, t.trial_ends_at,
                   t.created_at, t.activated_at, t.suspended_at, t.suspended_reason,
                   t.last_activity_at,
                   p.name_ar as plan_name, p.code as plan_code, p.price_monthly,
                   p.max_users,
                   coalesce(snap.users_count, 0)        as users_count,
                   coalesce(snap.orders_this_month, 0)  as orders_this_month,
                   coalesce(snap.products_count, 0)     as products_count,
                   coalesce(snap.storage_used_mb, 0)    as storage_used_mb
            from platform.tenants t
            left join platform.plans p on p.id = t.plan_id
            left join lateral (
                select users_count, orders_this_month, products_count, storage_used_mb
                from platform.tenant_usage_snapshots
                where tenant_id = t.id
                order by snapshot_date desc
                limit 1
            ) snap on true
            where 1=1
            """);

        if (status != null && !status.isBlank()) {
            sql.append(" and t.status = '").append(status.replace("'", "")).append("'");
        }
        if (search != null && !search.isBlank()) {
            String q = search.replace("'", "''");
            sql.append(" and (t.company_name ilike '%").append(q)
               .append("%' or t.contact_email ilike '%").append(q).append("%')");
        }
        sql.append(" order by t.created_at desc");

        return jdbc.queryForList(sql.toString());
    }

    public Map<String, Object> getTenant(Long id) {
        return jdbc.queryForMap(
            """
            select t.id, t.public_id, t.schema_name, t.company_name, t.contact_email,
                   t.contact_phone, t.wilaya_code, t.status, t.trial_ends_at,
                   t.created_at, t.activated_at, t.suspended_at, t.suspended_reason,
                   p.name_ar as plan_name, p.code as plan_code
            from platform.tenants t
            left join platform.plans p on p.id = t.plan_id
            where t.id = ?
            """, id);
    }

    @Transactional
    public Map<String, Object> createTenant(Map<String, String> body) {
        String companyName  = required(body, "companyName");
        String contactEmail = required(body, "contactEmail");
        String contactPhone = body.getOrDefault("contactPhone", null);
        String wilayaCode   = body.getOrDefault("wilayaCode", null);
        String planCode     = body.getOrDefault("planCode", "trial");
        String ownerName    = body.getOrDefault("ownerName", companyName + " Admin");
        String ownerEmail   = body.getOrDefault("ownerEmail", contactEmail);
        String ownerPassword = body.getOrDefault("ownerPassword", "Change@" + System.currentTimeMillis());

        // Generate schema name
        String schemaName = TenantSchemaService.generateSchemaName();

        // Get plan id
        Long planId = jdbc.queryForObject(
            "select id from platform.plans where code = ?", Long.class, planCode);

        LocalDate trialEnd = "trial".equals(planCode)
            ? LocalDate.now().plusDays(14) : null;

        // Insert into platform.tenants
        Long tenantId = jdbc.queryForObject(
            """
            insert into platform.tenants
              (schema_name, company_name, contact_email, contact_phone, wilaya_code,
               status, plan_id, trial_ends_at)
            values (?,?,?,?,?, ?,?,?)
            returning id
            """, Long.class,
            schemaName, companyName, contactEmail, contactPhone, wilayaCode,
            "trial".equals(planCode) ? "trial" : "active",
            planId, trialEnd);

        // Log provisioning start
        jdbc.update(
            """
            insert into platform.tenant_provisioning_events
              (tenant_id, event_type, status, details_json)
            values (?, 'provision', 'started', '{}')
            """, tenantId);

        // Provision the schema (runs all T01-T20 scripts)
        try {
            tenantSchemaService.provision(schemaName, ownerName, ownerEmail, ownerPassword);
            jdbc.update(
                "update platform.tenant_provisioning_events set status='completed' where tenant_id=? and status='started'",
                tenantId);
        } catch (Exception e) {
            jdbc.update("update platform.tenants set status='provisioning_failed' where id=?", tenantId);
            jdbc.update(
                "update platform.tenant_provisioning_events set status='failed', details_json=? where tenant_id=? and status='started'",
                "{\"error\":\"" + e.getMessage().replace("\"","") + "\"}",
                tenantId);
            throw new RuntimeException("Tenant provisioning failed: " + e.getMessage(), e);
        }

        return Map.of(
            "tenantId", tenantId,
            "schemaName", schemaName,
            "ownerEmail", ownerEmail,
            "ownerPassword", ownerPassword,
            "status", "trial".equals(planCode) ? "trial" : "active"
        );
    }

    @Transactional
    public void resetOwnerPassword(Long id, String newPassword) {
        if (newPassword == null || newPassword.length() < 8)
            throw new IllegalArgumentException("كلمة المرور يجب أن تكون 8 أحرف على الأقل");

        String schemaName = jdbc.queryForObject(
            "select schema_name from platform.tenants where id = ?", String.class, id);
        if (schemaName == null) throw new IllegalArgumentException("Tenant not found");

        String hash = passwordEncoder.encode(newPassword);

        // Reset the first admin_user (owner) in the tenant schema
        int updated = jdbc.update(
            String.format(
                """
                update "%s".users set password_hash = ?
                where id = (
                    select id from "%s".users
                    where user_type = 'admin_user' and deleted_at is null
                    order by id limit 1
                )
                """, schemaName, schemaName),
            hash);

        if (updated == 0) {
            // fallback: update the first active user
            jdbc.update(
                String.format(
                    """
                    update "%s".users set password_hash = ?
                    where id = (
                        select id from "%s".users
                        where deleted_at is null
                        order by id limit 1
                    )
                    """, schemaName, schemaName),
                hash);
        }
    }

    @Transactional
    public void updateTenantStatus(Long id, String status, String reason) {
        if (status == null) return;
        switch (status) {
            case "suspended" -> jdbc.update(
                "update platform.tenants set status='suspended', suspended_at=now(), suspended_reason=? where id=?",
                reason, id);
            case "active" -> jdbc.update(
                "update platform.tenants set status='active', activated_at=now(), suspended_at=null, suspended_reason=null where id=?",
                id);
            case "cancelled" -> jdbc.update(
                "update platform.tenants set status='cancelled', cancelled_at=now() where id=?", id);
            default -> throw new IllegalArgumentException("Unknown status: " + status);
        }
    }

    // ─── Plans ────────────────────────────────────────────────────────────────
    public List<Map<String, Object>> listPlans() {
        return jdbc.queryForList(
            """
            select p.id, p.code, p.name_ar, p.name_en, p.price_monthly,
                   p.max_users, p.max_orders_monthly, p.max_products, p.is_active,
                   count(t.id) as tenant_count
            from platform.plans p
            left join platform.tenants t on t.plan_id = p.id and t.status not in ('cancelled')
            group by p.id
            order by p.sort_order
            """);
    }

    @Transactional
    public void updatePlan(Long id, Map<String, Object> body) {
        List<String> parts  = new ArrayList<>();
        List<Object> params = new ArrayList<>();

        if (body.containsKey("price_monthly")) {
            parts.add("price_monthly = ?");
            Object v = body.get("price_monthly");
            params.add((v == null || v.toString().isBlank()) ? null
                    : new BigDecimal(v.toString()));
        }
        if (body.containsKey("max_users")) {
            parts.add("max_users = ?");
            Object v = body.get("max_users");
            params.add((v == null || v.toString().isBlank()) ? null
                    : Integer.parseInt(v.toString()));
        }
        if (body.containsKey("max_orders_monthly")) {
            parts.add("max_orders_monthly = ?");
            Object v = body.get("max_orders_monthly");
            params.add((v == null || v.toString().isBlank()) ? null
                    : Integer.parseInt(v.toString()));
        }
        if (body.containsKey("max_products")) {
            parts.add("max_products = ?");
            Object v = body.get("max_products");
            params.add((v == null || v.toString().isBlank()) ? null
                    : Integer.parseInt(v.toString()));
        }
        if (body.containsKey("is_active")) {
            parts.add("is_active = ?");
            params.add(Boolean.parseBoolean(body.get("is_active").toString()));
        }

        if (parts.isEmpty()) return;

        parts.add("updated_at = now()");
        params.add(id);

        jdbc.update(
            "update platform.plans set " + String.join(", ", parts) + " where id = ?",
            params.toArray());
    }

    public List<Map<String, Object>> getPublicPlans() {
        return jdbc.queryForList(
            """
            select p.id, p.code, p.name_ar, p.name_en,
                   p.price_monthly, p.max_users, p.max_orders_monthly,
                   p.max_products, p.is_active, p.sort_order
            from platform.plans p
            where p.is_active = true
            order by p.sort_order
            """);
    }

    // ─── Revenue ──────────────────────────────────────────────────────────────
    public Map<String, Object> getRevenue() {
        Map<String, Object> data = new HashMap<>();

        // Monthly revenue per plan (last 6 months)
        List<Map<String, Object>> monthly = jdbc.queryForList(
            """
            select to_char(date_trunc('month', s.created_at), 'YYYY-MM') as month,
                   sum(s.price_monthly) as revenue,
                   count(*) as subscriptions
            from platform.subscriptions s
            where s.status in ('active','trial')
              and s.created_at >= now() - interval '6 months'
            group by date_trunc('month', s.created_at)
            order by 1
            """);
        data.put("monthly", monthly);

        // Total collected (active subscriptions)
        Double totalMrr = jdbc.queryForObject(
            "select coalesce(sum(price_monthly),0) from platform.subscriptions where status='active'",
            Double.class);
        data.put("mrr", totalMrr != null ? totalMrr : 0.0);

        // Revenue by plan
        List<Map<String, Object>> byPlan = jdbc.queryForList(
            """
            select p.name_ar, p.code, p.price_monthly,
                   count(s.id) as active_subs,
                   coalesce(sum(s.price_monthly), 0) as plan_revenue
            from platform.plans p
            left join platform.subscriptions s on s.plan_id = p.id and s.status = 'active'
            group by p.id, p.name_ar, p.code, p.price_monthly
            order by p.sort_order
            """);
        data.put("byPlan", byPlan);

        return data;
    }

    // ─── Events ───────────────────────────────────────────────────────────────
    public List<Map<String, Object>> listEvents(int limit) {
        return jdbc.queryForList(
            """
            select e.id, e.event_type, e.status, e.created_at,
                   t.company_name, t.schema_name
            from platform.tenant_provisioning_events e
            left join platform.tenants t on t.id = e.tenant_id
            order by e.created_at desc
            limit ?
            """, limit);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
    private Long count(String sql) {
        Long v = jdbc.queryForObject(sql, Long.class);
        return v != null ? v : 0L;
    }

    private String required(Map<String, String> body, String key) {
        String v = body.get(key);
        if (v == null || v.isBlank()) throw new IllegalArgumentException("Missing required field: " + key);
        return v;
    }
}
