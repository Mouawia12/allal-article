package com.allalarticle.backend.accounting.service;

import com.allalarticle.backend.accounting.dto.AccountRequest;
import com.allalarticle.backend.accounting.dto.AccountResponse;
import com.allalarticle.backend.accounting.entity.Account;
import com.allalarticle.backend.accounting.repository.AccountRepository;
import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.FileCopyUtils;

import java.io.InputStreamReader;
import java.io.Reader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepo;
    private final JdbcTemplate jdbc;

    @Transactional
    public List<AccountResponse> findAll() {
        ensureDefaultChartIfEmpty();
        Map<Long, BalanceSnapshot> balances = loadBalancesByAccount();
        return accountRepo.findByDeletedAtIsNullOrderBySortOrder().stream()
                .map(account -> {
                    BalanceSnapshot balance = balances.getOrDefault(account.getId(), BalanceSnapshot.ZERO);
                    return AccountResponse.from(account, balance.balance(), balance.debitTotal(), balance.creditTotal());
                }).toList();
    }

    @Transactional(readOnly = true)
    public AccountResponse findById(Long id) {
        return AccountResponse.from(getOrThrow(id));
    }

    @Transactional
    public AccountResponse create(AccountRequest req, Long userId) {
        if (accountRepo.existsByCode(req.code())) {
            throw new AppException(ErrorCode.CONFLICT, "رمز الحساب موجود مسبقاً", HttpStatus.CONFLICT);
        }
        Account.AccountBuilder builder = Account.builder()
                .code(req.code())
                .nameAr(req.nameAr())
                .nameFr(req.nameFr())
                .classification(req.classification())
                .financialStatement(req.financialStatement())
                .normalBalance(req.normalBalance())
                .reportSection(req.reportSection())
                .statementLineCode(req.statementLineCode())
                .statementSortOrder(req.statementSortOrder())
                .postable(req.postable())
                .sortOrder(req.sortOrder())
                .custom(true)
                .createdById(userId);

        if (req.parentId() != null) {
            Account parent = getOrThrow(req.parentId());
            builder.parent(parent).level((short) (parent.getLevel() + 1));
        } else {
            builder.level((short) 1);
        }

        Account saved = accountRepo.save(builder.build());
        saved.setPath(buildPath(saved));
        return AccountResponse.from(accountRepo.save(saved));
    }

    @Transactional
    public AccountResponse update(Long id, AccountRequest req) {
        Account acc = getOrThrow(id);
        if (!acc.getCode().equals(req.code()) && accountRepo.existsByCode(req.code())) {
            throw new AppException(ErrorCode.CONFLICT, "رمز الحساب موجود مسبقاً", HttpStatus.CONFLICT);
        }
        acc.setCode(req.code());
        acc.setNameAr(req.nameAr());
        acc.setNameFr(req.nameFr());
        acc.setClassification(req.classification());
        acc.setFinancialStatement(req.financialStatement());
        acc.setNormalBalance(req.normalBalance());
        acc.setReportSection(req.reportSection());
        acc.setStatementLineCode(req.statementLineCode());
        acc.setStatementSortOrder(req.statementSortOrder());
        acc.setPostable(req.postable());
        acc.setSortOrder(req.sortOrder());
        return AccountResponse.from(accountRepo.save(acc));
    }

    @Transactional
    public void delete(Long id) {
        Account acc = getOrThrow(id);
        acc.setDeletedAt(OffsetDateTime.now());
        accountRepo.save(acc);
    }

    private String buildPath(Account acc) {
        if (acc.getParent() == null) return "/" + acc.getCode();
        String parentPath = acc.getParent().getPath();
        return (parentPath != null && !parentPath.isBlank() ? parentPath : "/" + acc.getParent().getCode())
                + "/" + acc.getCode();
    }

    Account getOrThrow(Long id) {
        return accountRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "الحساب غير موجود", HttpStatus.NOT_FOUND));
    }

    private void ensureDefaultChartIfEmpty() {
        if (accountRepo.count() > 0) return;
        String schema = TenantContext.get();
        if (!TenantContext.isValidSchema(schema)) return;
        try {
            ClassPathResource resource = new ClassPathResource("db/migration/tenant/T20__seed_chart_of_accounts.sql");
            try (Reader reader = new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8)) {
                jdbc.execute("set local search_path to \"" + schema + "\"");
                jdbc.execute(FileCopyUtils.copyToString(reader));
            }
        } catch (Exception e) {
            log.warn("Failed to seed default chart of accounts: {}", e.getMessage());
        }
    }

    private Map<Long, BalanceSnapshot> loadBalancesByAccount() {
        String schema = TenantContext.get();
        if (!TenantContext.isValidSchema(schema)) return Map.of();

        List<Map<String, Object>> rows = jdbc.queryForList(String.format("""
            WITH ledger AS (
                SELECT
                    a.id AS account_id,
                    COALESCE(SUM(CASE WHEN j.id IS NOT NULL THEN ji.debit ELSE 0 END), 0)  AS journal_debit,
                    COALESCE(SUM(CASE WHEN j.id IS NOT NULL THEN ji.credit ELSE 0 END), 0) AS journal_credit
                FROM "%1$s".accounts a
                LEFT JOIN "%1$s".journal_items ji ON ji.account_id = a.id
                LEFT JOIN "%1$s".journals j ON j.id = ji.journal_id AND j.status = 'posted'
                WHERE a.deleted_at IS NULL
                GROUP BY a.id
            ),
            opening AS (
                SELECT
                    account_id,
                    COALESCE(SUM(debit_balance), 0)  AS opening_debit,
                    COALESCE(SUM(credit_balance), 0) AS opening_credit
                FROM "%1$s".opening_balances
                GROUP BY account_id
            ),
            customer_ops AS (
                SELECT COALESCE(SUM(GREATEST(
                    COALESCE(c.opening_balance, 0)
                    + COALESCE(o.total_orders, 0)
                    - COALESCE(p.net_paid, 0), 0)), 0) AS amount
                FROM "%1$s".customers c
                LEFT JOIN (
                    SELECT customer_id, SUM(total_amount) AS total_orders
                    FROM "%1$s".orders
                    WHERE deleted_at IS NULL
                      AND order_status NOT IN ('draft', 'cancelled', 'rejected')
                    GROUP BY customer_id
                ) o ON o.customer_id = c.id
                LEFT JOIN (
                    SELECT customer_id,
                           SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END) AS net_paid
                    FROM "%1$s".customer_payments
                    GROUP BY customer_id
                ) p ON p.customer_id = c.id
                WHERE c.deleted_at IS NULL
            ),
            supplier_ops AS (
                SELECT COALESCE(SUM(total_amount), 0) AS amount
                FROM "%1$s".purchase_orders
                WHERE status NOT IN ('draft', 'cancelled')
                  AND payment_status <> 'paid'
            ),
            cash_ops AS (
                SELECT COALESCE(SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END), 0) AS amount
                FROM "%1$s".customer_payments
                WHERE payment_method = 'cash'
            ),
            bank_ops AS (
                SELECT COALESCE(SUM(CASE WHEN direction = 'in' THEN amount ELSE -amount END), 0) AS amount
                FROM "%1$s".customer_payments
                WHERE payment_method IN ('bank', 'bank_transfer', 'ccp', 'cheque', 'check')
            ),
            sales_ops AS (
                SELECT COALESCE(SUM(total_amount), 0) AS amount
                FROM "%1$s".orders
                WHERE deleted_at IS NULL
                  AND order_status NOT IN ('draft', 'cancelled', 'rejected')
            ),
            latest_product_cost AS (
                SELECT DISTINCT ON (poi.product_id)
                    poi.product_id,
                    COALESCE(NULLIF(poi.unit_price, 0), p.current_price_amount, 0) AS unit_cost
                FROM "%1$s".purchase_order_items poi
                JOIN "%1$s".purchase_orders po ON po.id = poi.purchase_order_id
                JOIN "%1$s".products p ON p.id = poi.product_id
                WHERE po.status = 'received'
                ORDER BY poi.product_id, po.received_date DESC NULLS LAST, po.created_at DESC
            ),
            inventory_ops AS (
                SELECT COALESCE(SUM(
                    ps.on_hand_qty * COALESCE(lpc.unit_cost, p.current_price_amount, 0)
                ), 0) AS amount
                FROM "%1$s".product_stocks ps
                JOIN "%1$s".products p ON p.id = ps.product_id
                LEFT JOIN latest_product_cost lpc ON lpc.product_id = ps.product_id
                WHERE p.deleted_at IS NULL
            ),
            cogs_ops AS (
                SELECT COALESCE(SUM(
                    COALESCE(NULLIF(oi.shipped_qty, 0), oi.approved_qty, 0)
                    * COALESCE(lpc.unit_cost, oi.unit_price, p.current_price_amount, 0)
                ), 0) AS amount
                FROM "%1$s".order_items oi
                JOIN "%1$s".orders o ON o.id = oi.order_id
                JOIN "%1$s".products p ON p.id = oi.product_id
                LEFT JOIN latest_product_cost lpc ON lpc.product_id = oi.product_id
                WHERE o.deleted_at IS NULL
                  AND oi.deleted_at IS NULL
                  AND o.order_status IN ('shipped', 'completed')
            )
            SELECT
                a.id,
                a.code,
                a.normal_balance,
                COALESCE(o.opening_debit, 0) + COALESCE(l.journal_debit, 0) AS debit_total,
                COALESCE(o.opening_credit, 0) + COALESCE(l.journal_credit, 0) AS credit_total,
                CASE
                    WHEN a.code IN ('1201', '41101')
                         AND COALESCE(o.opening_debit, 0) + COALESCE(o.opening_credit, 0)
                           + COALESCE(l.journal_debit, 0) + COALESCE(l.journal_credit, 0) = 0
                    THEN (SELECT amount FROM customer_ops)
                    WHEN a.code IN ('2101', '40101')
                         AND COALESCE(o.opening_debit, 0) + COALESCE(o.opening_credit, 0)
                           + COALESCE(l.journal_debit, 0) + COALESCE(l.journal_credit, 0) = 0
                    THEN (SELECT amount FROM supplier_ops)
                    WHEN a.code IN ('1301', '53001')
                         AND COALESCE(o.opening_debit, 0) + COALESCE(o.opening_credit, 0)
                           + COALESCE(l.journal_debit, 0) + COALESCE(l.journal_credit, 0) = 0
                    THEN (SELECT amount FROM cash_ops)
                    WHEN a.code IN ('1302', '51201')
                         AND COALESCE(o.opening_debit, 0) + COALESCE(o.opening_credit, 0)
                           + COALESCE(l.journal_debit, 0) + COALESCE(l.journal_credit, 0) = 0
                    THEN (SELECT amount FROM bank_ops)
                    WHEN a.code IN ('1101', '3001')
                         AND COALESCE(o.opening_debit, 0) + COALESCE(o.opening_credit, 0)
                           + COALESCE(l.journal_debit, 0) + COALESCE(l.journal_credit, 0) = 0
                    THEN (SELECT amount FROM inventory_ops)
                    WHEN a.code IN ('4001', '70011')
                         AND COALESCE(o.opening_debit, 0) + COALESCE(o.opening_credit, 0)
                           + COALESCE(l.journal_debit, 0) + COALESCE(l.journal_credit, 0) = 0
                    THEN (SELECT amount FROM sales_ops)
                    WHEN a.code IN ('5001', '60101')
                         AND COALESCE(o.opening_debit, 0) + COALESCE(o.opening_credit, 0)
                           + COALESCE(l.journal_debit, 0) + COALESCE(l.journal_credit, 0) = 0
                    THEN (SELECT amount FROM cogs_ops)
                    WHEN a.normal_balance = 'credit'
                    THEN COALESCE(o.opening_credit, 0) + COALESCE(l.journal_credit, 0)
                       - COALESCE(o.opening_debit, 0) - COALESCE(l.journal_debit, 0)
                    ELSE COALESCE(o.opening_debit, 0) + COALESCE(l.journal_debit, 0)
                       - COALESCE(o.opening_credit, 0) - COALESCE(l.journal_credit, 0)
                END AS balance
            FROM "%1$s".accounts a
            LEFT JOIN ledger l ON l.account_id = a.id
            LEFT JOIN opening o ON o.account_id = a.id
            WHERE a.deleted_at IS NULL
            """, schema));

        return rows.stream()
                .collect(Collectors.toMap(
                        row -> ((Number) row.get("id")).longValue(),
                        row -> new BalanceSnapshot(
                                toBigDecimal(row.get("balance")),
                                toBigDecimal(row.get("debit_total")),
                                toBigDecimal(row.get("credit_total"))
                        ),
                        (left, right) -> left
                ));
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal decimal) return decimal;
        if (value instanceof Number number) return BigDecimal.valueOf(number.doubleValue());
        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    private record BalanceSnapshot(BigDecimal balance, BigDecimal debitTotal, BigDecimal creditTotal) {
        private static final BalanceSnapshot ZERO = new BalanceSnapshot(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
    }
}
