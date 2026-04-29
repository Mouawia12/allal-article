package com.allalarticle.backend.accounting.controller;

import com.allalarticle.backend.common.response.ApiResponse;
import com.allalarticle.backend.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounting/dimensions")
@RequiredArgsConstructor
public class DimensionsController {

    private final JdbcTemplate jdbc;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> list() {
        String s = TenantContext.get();

        List<Map<String, Object>> types = jdbc.queryForList(String.format("""
            SELECT id, code, name_ar AS label, is_required AS required, is_active AS active
            FROM "%s".dimension_types ORDER BY id
            """, s));

        List<Map<String, Object>> items = jdbc.queryForList(String.format("""
            SELECT d.id, dt.code AS type, d.code, d.name_ar AS name, d.is_active AS active
            FROM "%s".dimensions d
            JOIN "%s".dimension_types dt ON dt.id = d.dimension_type_id
            ORDER BY dt.id, d.id
            """, s, s));

        // Group items by type
        java.util.Map<String, List<Map<String, Object>>> grouped = new java.util.LinkedHashMap<>();
        for (Map<String, Object> t : types) {
            String code = (String) t.get("code");
            grouped.put(code, items.stream().filter(i -> code.equals(i.get("type"))).toList());
        }

        // Revenue by wilaya from orders
        List<Map<String, Object>> profitByWilaya = jdbc.queryForList(String.format("""
            SELECT
                COALESCE(w.name, '—')       AS dim,
                SUM(o.total_amount)          AS revenue,
                0                            AS cogs,
                SUM(o.total_amount)          AS gross
            FROM "%s".orders o
            LEFT JOIN "%s".customers c ON c.id = o.customer_id
            LEFT JOIN "%s".wilayas w   ON w.id = c.wilaya_id
            WHERE o.order_status NOT IN ('draft','cancelled')
            GROUP BY w.name
            ORDER BY revenue DESC
            """, s, s, s));

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "types",         types,
                "grouped",       grouped,
                "profitByWilaya", profitByWilaya
        )));
    }

    @PostMapping("/types/{typeCode}/items")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> addItem(
            @PathVariable String typeCode,
            @RequestBody Map<String, Object> body) {
        String s = TenantContext.get();
        jdbc.update(String.format("""
            INSERT INTO "%s".dimensions (dimension_type_id, code, name_ar, is_active)
            SELECT id, ?, ?, true FROM "%s".dimension_types WHERE code = ?
            ON CONFLICT (dimension_type_id, code) DO NOTHING
            """, s, s),
                body.get("code"), body.get("name"), typeCode);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PutMapping("/items/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> updateItem(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        String s = TenantContext.get();
        jdbc.update(String.format("""
            UPDATE "%s".dimensions SET code = ?, name_ar = ?
            WHERE id = ?
            """, s),
                body.get("code"), body.get("name"), id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
