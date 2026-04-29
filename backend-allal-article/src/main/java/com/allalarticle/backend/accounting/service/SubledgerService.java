package com.allalarticle.backend.accounting.service;

import com.allalarticle.backend.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SubledgerService {

    private final JdbcTemplate jdbc;

    public Map<String, Object> summary() {
        String s = TenantContext.get();

        // Customer AR: customers with their unpaid orders total + accounting balance
        List<Map<String, Object>> customers = jdbc.queryForList(String.format("""
            SELECT
                c.id,
                c.name,
                COALESCE(c.phone, '—')                                          AS phone,
                COALESCE(SUM(CASE WHEN o.payment_status != 'paid' THEN o.total_amount ELSE 0 END), 0) AS balance,
                COALESCE(
                    (SELECT SUM(ji.debit) - SUM(ji.credit)
                     FROM "%s".journal_items ji
                     JOIN "%s".journals j ON j.id = ji.journal_id AND j.status = 'posted'
                     JOIN "%s".accounts  a ON a.id = ji.account_id AND a.code LIKE '411%%'
                     WHERE j.reference_id IN (SELECT id FROM "%s".orders WHERE customer_id = c.id)
                    ), 0)                                                        AS "ledgerBalance"
            FROM "%s".customers c
            LEFT JOIN "%s".orders o ON o.customer_id = c.id
                AND o.order_status NOT IN ('draft','cancelled')
            WHERE c.deleted_at IS NULL
            GROUP BY c.id, c.name, c.phone
            HAVING COALESCE(SUM(CASE WHEN o.payment_status != 'paid' THEN o.total_amount ELSE 0 END), 0) > 0
               OR c.opening_balance > 0
            ORDER BY balance DESC
            """, s, s, s, s, s, s));

        // Control balance for 4110 account
        BigDecimal customerControl = queryAccountBalance(s, "4110");

        // Supplier AP: suppliers with outstanding purchase orders
        List<Map<String, Object>> suppliers = jdbc.queryForList(String.format("""
            SELECT
                sup.id,
                sup.name,
                COALESCE(sup.phone, '—')                                         AS phone,
                COALESCE(SUM(CASE WHEN po.payment_status != 'paid' THEN po.total_amount ELSE 0 END), 0) AS balance,
                COALESCE(
                    (SELECT SUM(ji.credit) - SUM(ji.debit)
                     FROM "%s".journal_items ji
                     JOIN "%s".journals j ON j.id = ji.journal_id AND j.status = 'posted'
                     JOIN "%s".accounts  a ON a.id = ji.account_id AND a.code LIKE '401%%'
                     WHERE j.reference_id IN (SELECT id FROM "%s".purchase_orders WHERE supplier_id = sup.id)
                    ), 0)                                                         AS "ledgerBalance"
            FROM "%s".suppliers sup
            LEFT JOIN "%s".purchase_orders po ON po.supplier_id = sup.id
                AND po.status NOT IN ('draft','cancelled')
            WHERE sup.deleted_at IS NULL
            GROUP BY sup.id, sup.name, sup.phone
            HAVING COALESCE(SUM(CASE WHEN po.payment_status != 'paid' THEN po.total_amount ELSE 0 END), 0) > 0
            ORDER BY balance DESC
            """, s, s, s, s, s, s));

        BigDecimal supplierControl = queryAccountBalance(s, "4010");

        // Tax subledger: aggregate journal_items on 441x accounts
        List<Map<String, Object>> taxes = jdbc.queryForList(String.format("""
            SELECT
                a.code,
                a.name_ar                                    AS label,
                COALESCE(SUM(ji.credit), 0)                  AS payable,
                COALESCE(SUM(ji.debit), 0)                   AS recoverable,
                COALESCE(SUM(ji.credit) - SUM(ji.debit), 0)  AS net
            FROM "%s".accounts a
            LEFT JOIN "%s".journal_items ji ON ji.account_id = a.id
            LEFT JOIN "%s".journals j       ON j.id = ji.journal_id AND j.status = 'posted'
            WHERE a.code LIKE '441%%' AND a.is_postable = true AND a.deleted_at IS NULL
            GROUP BY a.id, a.code, a.name_ar
            ORDER BY a.sort_order
            """, s, s, s));

        // Bank accounts balances
        List<Map<String, Object>> bankAccounts = jdbc.queryForList(String.format("""
            SELECT
                a.id,
                a.code          AS "accountCode",
                a.name_ar       AS name,
                COALESCE(SUM(ji.debit) - SUM(ji.credit), 0) AS balance
            FROM "%s".accounts a
            LEFT JOIN "%s".journal_items ji ON ji.account_id = a.id
            LEFT JOIN "%s".journals j       ON j.id = ji.journal_id AND j.status = 'posted'
            WHERE a.deleted_at IS NULL AND a.is_postable = true AND a.code LIKE '512%%'
            GROUP BY a.id, a.code, a.name_ar
            ORDER BY a.sort_order
            """, s, s, s));

        // Add matched flag to customers and suppliers
        BigDecimal custTotal = customers.stream()
                .map(c -> toBD(c.get("balance"))).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal suppTotal = suppliers.stream()
                .map(c -> toBD(c.get("balance"))).reduce(BigDecimal.ZERO, BigDecimal::add);

        customers = customers.stream().map(c -> {
            var m = new java.util.HashMap<>(c);
            BigDecimal bal = toBD(c.get("balance"));
            BigDecimal led = toBD(c.get("ledgerBalance"));
            m.put("matched", bal.compareTo(led) == 0 || led.compareTo(BigDecimal.ZERO) == 0);
            return (Map<String, Object>) m;
        }).toList();

        suppliers = suppliers.stream().map(c -> {
            var m = new java.util.HashMap<>(c);
            BigDecimal bal = toBD(c.get("balance"));
            BigDecimal led = toBD(c.get("ledgerBalance"));
            m.put("matched", bal.compareTo(led) == 0 || led.compareTo(BigDecimal.ZERO) == 0);
            return (Map<String, Object>) m;
        }).toList();

        return Map.of(
                "customers",       customers,
                "customerControl", customerControl,
                "customerTotal",   custTotal,
                "suppliers",       suppliers,
                "supplierControl", supplierControl,
                "supplierTotal",   suppTotal,
                "taxes",           taxes,
                "bankAccounts",    bankAccounts
        );
    }

    private BigDecimal queryAccountBalance(String schema, String code) {
        try {
            BigDecimal val = jdbc.queryForObject(String.format("""
                SELECT COALESCE(SUM(ji.debit) - SUM(ji.credit), 0)
                FROM "%s".journal_items ji
                JOIN "%s".journals j ON j.id = ji.journal_id AND j.status = 'posted'
                JOIN "%s".accounts a ON a.id = ji.account_id AND a.code = ?
                """, schema, schema, schema), BigDecimal.class, code);
            return val != null ? val : BigDecimal.ZERO;
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private BigDecimal toBD(Object v) {
        if (v == null) return BigDecimal.ZERO;
        if (v instanceof BigDecimal bd) return bd;
        try { return new BigDecimal(v.toString()); } catch (Exception e) { return BigDecimal.ZERO; }
    }
}
