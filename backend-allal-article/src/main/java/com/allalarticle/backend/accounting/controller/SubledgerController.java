package com.allalarticle.backend.accounting.controller;

import com.allalarticle.backend.accounting.service.SubledgerService;
import com.allalarticle.backend.common.response.ApiResponse;
import com.allalarticle.backend.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounting/subledgers")
@RequiredArgsConstructor
public class SubledgerController {

    private final SubledgerService subledgerService;
    private final JdbcTemplate jdbc;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> summary() {
        return ResponseEntity.ok(ApiResponse.ok(subledgerService.summary()));
    }

    @GetMapping("/reconciliation")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reconciliation(
            @RequestParam(defaultValue = "customer") String type) {
        String s = TenantContext.get();

        if ("customer".equals(type)) {
            List<Map<String, Object>> customers = jdbc.queryForList(String.format("""
                SELECT
                    c.id,
                    c.name,
                    COALESCE(SUM(o.total_amount), 0)                          AS "subledgerBalance",
                    COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END), 0) AS paid_total,
                    0 AS "controlBalance",
                    true AS matched
                FROM "%s".customers c
                JOIN "%s".orders o ON o.customer_id = c.id
                    AND o.order_status NOT IN ('draft','cancelled')
                    AND o.payment_status != 'paid'
                WHERE c.deleted_at IS NULL
                GROUP BY c.id, c.name
                ORDER BY "subledgerBalance" DESC
                """, s, s));

            List<Map<String, Object>> enrichedCustomers = customers.stream().map(customer -> {
                Long cid = ((Number) customer.get("id")).longValue();
                List<Map<String, Object>> invoices = jdbc.queryForList(String.format("""
                    SELECT
                        o.order_number AS ref,
                        to_char(o.created_at, 'YYYY-MM-DD') AS date,
                        o.total_amount AS amount,
                        CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END AS paid,
                        CASE WHEN o.payment_status = 'paid' THEN 0 ELSE o.total_amount END AS balance
                    FROM "%s".orders o
                    WHERE o.customer_id = ? AND o.order_status NOT IN ('draft','cancelled')
                    ORDER BY o.created_at DESC
                    """, s), cid);
                java.util.Map<String, Object> enriched = new java.util.HashMap<>(customer);
                enriched.put("invoices", invoices);
                enriched.put("payments", List.of());
                return enriched;
            }).toList();
            return ResponseEntity.ok(ApiResponse.ok(Map.of("parties", enrichedCustomers, "type", "customer")));
        } else {
            List<Map<String, Object>> suppliers = jdbc.queryForList(String.format("""
                SELECT
                    sup.id,
                    sup.name,
                    COALESCE(SUM(po.total_amount), 0) AS "subledgerBalance",
                    0                                  AS "controlBalance",
                    true                               AS matched
                FROM "%s".suppliers sup
                JOIN "%s".purchase_orders po ON po.supplier_id = sup.id
                    AND po.status NOT IN ('draft','cancelled')
                    AND po.payment_status != 'paid'
                WHERE sup.deleted_at IS NULL
                GROUP BY sup.id, sup.name
                ORDER BY "subledgerBalance" DESC
                """, s, s));

            List<Map<String, Object>> enrichedSuppliers = suppliers.stream().map(supplier -> {
                Long sid = ((Number) supplier.get("id")).longValue();
                List<Map<String, Object>> invoices = jdbc.queryForList(String.format("""
                    SELECT
                        po.po_number AS ref,
                        to_char(po.created_at, 'YYYY-MM-DD') AS date,
                        po.total_amount AS amount,
                        CASE WHEN po.payment_status = 'paid' THEN po.total_amount ELSE 0 END AS paid,
                        CASE WHEN po.payment_status = 'paid' THEN 0 ELSE po.total_amount END AS balance
                    FROM "%s".purchase_orders po
                    WHERE po.supplier_id = ? AND po.status NOT IN ('draft','cancelled')
                    ORDER BY po.created_at DESC
                    """, s), sid);
                java.util.Map<String, Object> enriched = new java.util.HashMap<>(supplier);
                enriched.put("invoices", invoices);
                enriched.put("payments", List.of());
                return enriched;
            }).toList();
            return ResponseEntity.ok(ApiResponse.ok(Map.of("parties", enrichedSuppliers, "type", "supplier")));
        }
    }
}
