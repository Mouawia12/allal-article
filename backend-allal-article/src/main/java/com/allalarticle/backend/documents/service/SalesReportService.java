package com.allalarticle.backend.documents.service;

import com.allalarticle.backend.documents.dto.ProductSalesRow;
import com.allalarticle.backend.documents.dto.SalesReportRow;
import com.allalarticle.backend.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SalesReportService {

    private final JdbcTemplate jdbc;

    public List<SalesReportRow> salesByCustomer(LocalDate from, LocalDate to) {
        String schema = TenantContext.get();
        String sql = String.format("""
                SELECT c.id, c.name, COUNT(o.id) as order_count,
                       COALESCE(SUM(o.total_amount), 0) as total_amount,
                       COALESCE(SUM(o.total_weight), 0) as total_weight
                FROM "%s".orders o
                JOIN "%s".customers c ON c.id = o.customer_id
                WHERE o.order_status IN ('completed','shipped')
                  AND DATE(o.confirmed_at) BETWEEN ? AND ?
                  AND o.deleted_at IS NULL
                GROUP BY c.id, c.name
                ORDER BY total_amount DESC
                """, schema, schema);
        return jdbc.query(sql, (rs, i) -> new SalesReportRow(
                rs.getLong("id"), rs.getString("name"),
                rs.getLong("order_count"),
                rs.getBigDecimal("total_amount"),
                rs.getBigDecimal("total_weight")
        ), from, to);
    }

    public List<SalesReportRow> salesBySalesperson(LocalDate from, LocalDate to) {
        String schema = TenantContext.get();
        String sql = String.format("""
                SELECT u.id, u.name, COUNT(o.id) as order_count,
                       COALESCE(SUM(o.total_amount), 0) as total_amount,
                       COALESCE(SUM(o.total_weight), 0) as total_weight
                FROM "%s".orders o
                JOIN "%s".users u ON u.id = o.sales_user_id
                WHERE o.order_status IN ('completed','shipped')
                  AND DATE(o.confirmed_at) BETWEEN ? AND ?
                  AND o.deleted_at IS NULL
                GROUP BY u.id, u.name
                ORDER BY total_amount DESC
                """, schema, schema);
        return jdbc.query(sql, (rs, i) -> new SalesReportRow(
                rs.getLong("id"), rs.getString("name"),
                rs.getLong("order_count"),
                rs.getBigDecimal("total_amount"),
                rs.getBigDecimal("total_weight")
        ), from, to);
    }

    public List<SalesReportRow> salesByWilaya(LocalDate from, LocalDate to) {
        String schema = TenantContext.get();
        String sql = String.format("""
                SELECT w.id, w.name_ar, COUNT(o.id) as order_count,
                       COALESCE(SUM(o.total_amount), 0) as total_amount,
                       COALESCE(SUM(o.total_weight), 0) as total_weight
                FROM "%s".orders o
                JOIN "%s".customers c ON c.id = o.customer_id
                JOIN "%s".wilayas w ON w.id = c.wilaya_id
                WHERE o.order_status IN ('completed','shipped')
                  AND DATE(o.confirmed_at) BETWEEN ? AND ?
                  AND o.deleted_at IS NULL
                GROUP BY w.id, w.name_ar
                ORDER BY total_amount DESC
                """, schema, schema, schema);
        return jdbc.query(sql, (rs, i) -> new SalesReportRow(
                rs.getLong("id"), rs.getString("name_ar"),
                rs.getLong("order_count"),
                rs.getBigDecimal("total_amount"),
                rs.getBigDecimal("total_weight")
        ), from, to);
    }

    public List<ProductSalesRow> salesByProduct(LocalDate from, LocalDate to) {
        String schema = TenantContext.get();
        String sql = String.format("""
                SELECT p.id, p.name, p.sku,
                       COALESCE(SUM(oi.shipped_qty), 0) as total_qty,
                       COALESCE(SUM(oi.line_subtotal), 0) as total_revenue,
                       COUNT(DISTINCT o.id) as order_count
                FROM "%s".order_items oi
                JOIN "%s".orders o ON o.id = oi.order_id
                JOIN "%s".products p ON p.id = oi.product_id
                WHERE o.order_status IN ('completed','shipped')
                  AND DATE(o.confirmed_at) BETWEEN ? AND ?
                  AND o.deleted_at IS NULL
                  AND oi.deleted_at IS NULL
                GROUP BY p.id, p.name, p.sku
                ORDER BY total_revenue DESC
                """, schema, schema, schema);
        return jdbc.query(sql, (rs, i) -> new ProductSalesRow(
                rs.getLong("id"), rs.getString("name"), rs.getString("sku"),
                rs.getBigDecimal("total_qty"),
                rs.getBigDecimal("total_revenue"),
                rs.getLong("order_count")
        ), from, to);
    }
}
