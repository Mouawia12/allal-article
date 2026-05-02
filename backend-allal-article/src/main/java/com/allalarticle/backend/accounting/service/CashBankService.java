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

        // accounts with balance. Until auto-journals are fully wired, cash/bank fall back to customer payments.
        String accountsSql = String.format("""
            WITH payment_ops AS (
                SELECT
                    CASE WHEN payment_method = 'cash' THEN '1301' ELSE '1302' END AS account_code,
                    COALESCE(SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END), 0) AS amount
                FROM "%1$s".customer_payments
                WHERE payment_method IN ('cash', 'bank', 'cheque')
                GROUP BY CASE WHEN payment_method = 'cash' THEN '1301' ELSE '1302' END
            ),
            ledger AS (
                SELECT
                    a.id AS account_id,
                    COALESCE(SUM(CASE WHEN j.id IS NOT NULL THEN ji.debit ELSE 0 END), 0) AS debit,
                    COALESCE(SUM(CASE WHEN j.id IS NOT NULL THEN ji.credit ELSE 0 END), 0) AS credit
                FROM "%1$s".accounts a
                LEFT JOIN "%1$s".journal_items ji ON ji.account_id = a.id
                LEFT JOIN "%1$s".journals j       ON j.id = ji.journal_id AND j.status = 'posted'
                GROUP BY a.id
            )
            SELECT
                a.id,
                a.code          AS "accountCode",
                a.name_ar       AS name,
                a.currency,
                CASE WHEN a.code = '1301' THEN 'cash' ELSE 'bank' END AS type,
                CASE WHEN COALESCE(l.debit, 0) + COALESCE(l.credit, 0) = 0
                     THEN COALESCE(po.amount, 0)
                     ELSE COALESCE(l.debit, 0) - COALESCE(l.credit, 0)
                END AS balance
            FROM "%1$s".accounts a
            LEFT JOIN ledger l ON l.account_id = a.id
            LEFT JOIN payment_ops po ON po.account_code = a.code
            WHERE a.deleted_at IS NULL
              AND a.is_postable = true
              AND a.code IN ('1301', '1302', '1303')
            ORDER BY a.sort_order
            """, s);

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
              AND a.code IN ('1301', '1302', '1303')
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
