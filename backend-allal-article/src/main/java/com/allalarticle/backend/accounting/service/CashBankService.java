package com.allalarticle.backend.accounting.service;

import com.allalarticle.backend.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CashBankService {

    private final JdbcTemplate jdbc;

    public Map<String, Object> summary() {
        String s = TenantContext.get();

        // accounts with balance (SUM of posted journal items)
        String accountsSql = String.format("""
            SELECT
                a.id,
                a.code          AS "accountCode",
                a.name_ar       AS name,
                a.currency,
                CASE WHEN a.code LIKE '53%%' THEN 'cash' ELSE 'bank' END AS type,
                COALESCE(SUM(ji.debit) - SUM(ji.credit), 0) AS balance
            FROM "%s".accounts a
            LEFT JOIN "%s".journal_items ji ON ji.account_id = a.id
            LEFT JOIN "%s".journals j       ON j.id = ji.journal_id AND j.status = 'posted'
            WHERE a.deleted_at IS NULL
              AND a.is_postable = true
              AND (a.code LIKE '512%%' OR a.code LIKE '53%%')
            GROUP BY a.id, a.code, a.name_ar, a.currency
            ORDER BY a.sort_order
            """, s, s, s);

        List<Map<String, Object>> accounts = jdbc.queryForList(accountsSql);

        List<Map<String, Object>> cashAccounts = accounts.stream()
                .filter(a -> "cash".equals(a.get("type")))
                .toList();

        List<Map<String, Object>> bankAccounts = accounts.stream()
                .filter(a -> "bank".equals(a.get("type")))
                .toList();

        // recent transactions on cash/bank accounts
        String txSql = String.format("""
            SELECT
                ji.id,
                to_char(j.journal_date, 'YYYY-MM-DD')  AS date,
                j.reference_number                      AS ref,
                CASE WHEN ji.debit > 0 THEN 'receipt' ELSE 'payment' END AS type,
                GREATEST(ji.debit, ji.credit)           AS amount,
                ji.description                          AS party,
                a.code                                  AS "accountCode",
                ji.account_id                           AS "accountId"
            FROM "%s".journal_items ji
            JOIN "%s".journals j  ON j.id = ji.journal_id AND j.status = 'posted'
            JOIN "%s".accounts a  ON a.id = ji.account_id
            WHERE a.deleted_at IS NULL
              AND (a.code LIKE '512%%' OR a.code LIKE '53%%')
            ORDER BY j.journal_date DESC, ji.id DESC
            LIMIT 30
            """, s, s, s);

        List<Map<String, Object>> transactions = jdbc.queryForList(txSql);

        return Map.of(
                "cashAccounts",  cashAccounts,
                "bankAccounts",  bankAccounts,
                "transactions",  transactions
        );
    }
}
