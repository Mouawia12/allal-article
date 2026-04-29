package com.allalarticle.backend.dashboard;

import com.allalarticle.backend.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final JdbcTemplate jdbc;

    public Map<String, Object> getStats() {
        String s = TenantContext.get();
        if (s == null || s.isBlank()) throw new IllegalStateException("No tenant context");

        Map<String, Object> stats = new HashMap<>();

        // Order counts by status
        stats.put("totalOrders", count(s, "orders", "deleted_at IS NULL"));
        stats.put("ordersThisMonth", count(s, "orders",
            "deleted_at IS NULL AND date_trunc('month', created_at) = date_trunc('month', now())"));
        stats.put("pendingOrders", count(s, "orders",
            "deleted_at IS NULL AND order_status IN ('submitted','under_review','confirmed')"));
        stats.put("completedOrders", count(s, "orders",
            "deleted_at IS NULL AND order_status IN ('completed','shipped')"));

        // Revenue this month
        Double revenueMonth = jdbc.queryForObject(String.format("""
            SELECT COALESCE(SUM(total_amount), 0)
            FROM "%s".orders
            WHERE deleted_at IS NULL
              AND order_status IN ('completed','shipped')
              AND date_trunc('month', confirmed_at) = date_trunc('month', now())
            """, s), Double.class);
        stats.put("revenueThisMonth", revenueMonth != null ? revenueMonth : 0.0);

        // Total revenue all time
        Double totalRevenue = jdbc.queryForObject(String.format("""
            SELECT COALESCE(SUM(total_amount), 0)
            FROM "%s".orders
            WHERE deleted_at IS NULL AND order_status IN ('completed','shipped')
            """, s), Double.class);
        stats.put("totalRevenue", totalRevenue != null ? totalRevenue : 0.0);

        // Counts
        stats.put("totalCustomers", count(s, "customers", "deleted_at IS NULL AND status = 'active'"));
        stats.put("totalProducts",  count(s, "products",  "deleted_at IS NULL AND status = 'active'"));

        // Low stock (products with available qty = 0)
        Long lowStock = jdbc.queryForObject(String.format("""
            SELECT count(DISTINCT product_id)
            FROM "%s".product_stocks
            WHERE (on_hand_qty - reserved_qty) <= 0 OR on_hand_qty = 0
            """, s), Long.class);
        stats.put("lowStockProducts", lowStock != null ? lowStock : 0L);

        // Monthly sales chart (last 6 months)
        List<Map<String, Object>> monthlySales = jdbc.queryForList(String.format("""
            SELECT to_char(date_trunc('month', confirmed_at), 'YYYY-MM') as month,
                   to_char(date_trunc('month', confirmed_at), 'MMM') as month_label,
                   COUNT(*) as orders_count,
                   COALESCE(SUM(total_amount), 0) as revenue
            FROM "%s".orders
            WHERE deleted_at IS NULL
              AND order_status IN ('completed','shipped')
              AND confirmed_at >= now() - interval '6 months'
            GROUP BY date_trunc('month', confirmed_at)
            ORDER BY 1
            """, s));
        stats.put("monthlySales", monthlySales);

        // Orders by status distribution
        List<Map<String, Object>> byStatus = jdbc.queryForList(String.format("""
            SELECT order_status as status, COUNT(*) as count
            FROM "%s".orders
            WHERE deleted_at IS NULL
            GROUP BY order_status
            ORDER BY count DESC
            """, s));
        stats.put("ordersByStatus", byStatus);

        // Top customers this month
        List<Map<String, Object>> topCustomers = jdbc.queryForList(String.format("""
            SELECT c.name, COUNT(o.id) as orders_count, COALESCE(SUM(o.total_amount),0) as total
            FROM "%s".orders o
            JOIN "%s".customers c ON c.id = o.customer_id
            WHERE o.deleted_at IS NULL
              AND o.order_status IN ('completed','shipped')
              AND date_trunc('month', o.confirmed_at) = date_trunc('month', now())
            GROUP BY c.id, c.name
            ORDER BY total DESC
            LIMIT 5
            """, s, s));
        stats.put("topCustomers", topCustomers);

        return stats;
    }

    private Long count(String schema, String table, String where) {
        Long v = jdbc.queryForObject(
            String.format("SELECT count(*) FROM \"%s\".%s WHERE %s", schema, table, where),
            Long.class);
        return v != null ? v : 0L;
    }
}
