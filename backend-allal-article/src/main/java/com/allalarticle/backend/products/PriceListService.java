package com.allalarticle.backend.products;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.tenant.TenantContext;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class PriceListService {

    private final JdbcTemplate jdbc;
    private final Set<String> assignmentColumnsReady = ConcurrentHashMap.newKeySet();

    public List<Map<String, Object>> listAll() {
        String s = schema();
        ensureAssignmentColumns(s);
        var rows = jdbc.queryForList(String.format("""
            SELECT pl.id, pl.public_id::text, pl.code, pl.name,
                   pl.price_list_type as type,
                   pl.is_default, pl.is_active, pl.description,
                   to_char(pl.updated_at, 'YYYY-MM-DD') as updated_at,
                   count(pli.id) as items_count
            FROM "%s".price_lists pl
            LEFT JOIN "%s".price_list_items pli
              ON pli.price_list_id = pl.id AND pli.is_active = true
            WHERE pl.deleted_at IS NULL
            GROUP BY pl.id
            ORDER BY pl.is_default DESC, pl.name
            """, s, s));
        return rows.stream().<Map<String, Object>>map((row) -> {
            Map<String, Object> next = new java.util.LinkedHashMap<>(row);
            Long id = longValue(next.get("id"));
            String entityType = "purchase".equals(String.valueOf(next.get("type"))) ? "supplier" : "customer";
            List<Long> assignedIds = listAssignedIds(id, entityType);
            next.put("assignedIds", assignedIds);
            next.put("assigned_count", assignedIds.size());
            return next;
        }).toList();
    }

    public List<Map<String, Object>> listItems(Long listId) {
        String s = schema();
        return jdbc.queryForList(String.format("""
            SELECT pli.id, pli.product_id, p.sku as product_code, p.name as product_name,
                   COALESCE(pu.symbol, 'وحدة') as unit,
                   COALESCE(p.current_price_amount, 0) as base_price,
                   pli.unit_price_amount, pli.min_qty, pli.is_active
            FROM "%s".price_list_items pli
            JOIN "%s".products p ON p.id = pli.product_id
            LEFT JOIN "%s".product_units_catalog pu ON pu.id = p.base_unit_id
            WHERE pli.price_list_id = ?
              AND pli.is_active = true
              AND p.deleted_at IS NULL
            ORDER BY p.name
            """, s, s, s), listId);
    }

    @Transactional
    public Map<String, Object> create(Map<String, Object> body) {
        String s = schema();
        String code = body.getOrDefault("code", "PL-" + System.currentTimeMillis()).toString();
        String name = body.getOrDefault("name", "قائمة جديدة").toString();
        String type = body.getOrDefault("type", "sales").toString();
        String description = body.getOrDefault("description", "").toString();

        Long id = jdbc.queryForObject(String.format("""
            INSERT INTO "%s".price_lists (code, name, price_list_type, description, is_active)
            VALUES (?, ?, ?, ?, true) RETURNING id
            """, s), Long.class, code, name, type, description);

        return listAll().stream()
            .filter(m -> id.equals(m.get("id")))
            .findFirst()
            .orElse(Map.of("id", id, "name", name, "code", code, "type", type,
                    "is_active", true, "is_default", false, "items_count", 0L));
    }

    @Transactional
    public void upsertItem(Long listId, Long productId, BigDecimal unitPrice, Authentication auth) {
        String s = schema();
        if (unitPrice != null && unitPrice.signum() < 0) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Price cannot be negative", HttpStatus.BAD_REQUEST);
        }
        ensureListExists(s, listId);
        ensureProductExists(s, productId);
        BigDecimal previousPrice = findExistingItemPrice(s, listId, productId);
        Long userId = extractUserId(auth);
        Long itemId = jdbc.queryForObject(String.format("""
            INSERT INTO "%s".price_list_items
                (price_list_id, product_id, unit_price_amount, is_active, created_by, updated_by)
            VALUES (?, ?, ?, true, ?, ?)
            ON CONFLICT (price_list_id, product_id, min_qty) DO UPDATE
              SET unit_price_amount = EXCLUDED.unit_price_amount,
                  is_active = true,
                  updated_by = EXCLUDED.updated_by,
                  updated_at = now()
            RETURNING id
            """, s), Long.class, listId, productId, unitPrice, userId, userId);

        if (priceChanged(previousPrice, unitPrice)) {
            String currency = jdbc.queryForObject(String.format("""
                SELECT currency FROM "%s".price_lists WHERE id = ?
                """, s), String.class, listId);
            jdbc.update(String.format("""
                INSERT INTO "%s".product_price_histories
                    (product_id, previous_price_amount, new_price_amount, price_currency,
                     changed_by, change_reason, source_type, source_id)
                VALUES (?, ?, ?, ?, ?, ?, 'price_list', ?)
                """, s), productId, previousPrice, unitPrice,
                    currency != null ? currency : "DZD", userId,
                    previousPrice == null ? "سعر ابتدائي في قائمة أسعار" : "تعديل سعر قائمة أسعار",
                    itemId);
        }
    }

    @Transactional
    public void removeItem(Long listId, Long productId) {
        String s = schema();
        int updated = jdbc.update(String.format("""
            UPDATE "%s".price_list_items
            SET is_active = false, updated_at = now()
            WHERE price_list_id = ?
              AND product_id = ?
              AND min_qty = 1
              AND is_active = true
            """, s), listId, productId);
        if (updated == 0) {
            throw new AppException(ErrorCode.NOT_FOUND, "Price list item not found", HttpStatus.NOT_FOUND);
        }
    }

    public List<Long> listAssignedIds(Long listId, String entityType) {
        String s = schema();
        ensureAssignmentColumns(s);
        String normalized = normalizeEntityType(entityType);
        ensureListSupportsEntityType(s, listId, normalized);
        String table = "customer".equals(normalized) ? "customers" : "suppliers";
        String extraWhere = "customer".equals(normalized) ? "AND deleted_at IS NULL" : "";
        return jdbc.queryForList(String.format("""
            SELECT id
            FROM "%s".%s
            WHERE price_list_id = ?
              %s
            ORDER BY name
            """, s, table, extraWhere), Long.class, listId);
    }

    @Transactional
    public Map<String, Object> saveAssignments(Long listId, String entityType, List<Long> entityIds) {
        String s = schema();
        ensureAssignmentColumns(s);
        String normalized = normalizeEntityType(entityType);
        ensureListSupportsEntityType(s, listId, normalized);
        List<Long> ids = normalizeIds(entityIds);
        String table = "customer".equals(normalized) ? "customers" : "suppliers";
        String activeWhere = "customer".equals(normalized) ? "deleted_at IS NULL" : "status <> 'inactive'";

        if (!ids.isEmpty()) {
            String placeholders = placeholders(ids.size());
            Integer count = jdbc.queryForObject(String.format("""
                SELECT count(*)
                FROM "%s".%s
                WHERE id IN (%s)
                  AND %s
                """, s, table, placeholders, activeWhere), Integer.class, ids.toArray());
            if (count == null || count != ids.size()) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Some selected entities do not exist", HttpStatus.BAD_REQUEST);
            }
        }

        jdbc.update(String.format("""
            UPDATE "%s".%s
            SET price_list_id = NULL, updated_at = now()
            WHERE price_list_id = ?
            """, s, table), listId);

        if (!ids.isEmpty()) {
            List<Object> params = new ArrayList<>();
            params.add(listId);
            params.addAll(ids);
            jdbc.update(String.format("""
                UPDATE "%s".%s
                SET price_list_id = ?, updated_at = now()
                WHERE id IN (%s)
                  AND %s
                """, s, table, placeholders(ids.size()), activeWhere), params.toArray());
        }

        List<Long> assignedIds = listAssignedIds(listId, normalized);
        return Map.of(
                "entityType", normalized,
                "assignedIds", assignedIds,
                "assignedCount", assignedIds.size());
    }

    private String schema() {
        String s = TenantContext.get();
        if (s == null || s.isBlank()) throw new IllegalStateException("No tenant context");
        return s;
    }

    private String normalizeEntityType(String entityType) {
        String type = entityType != null ? entityType.trim().toLowerCase() : "";
        return switch (type) {
            case "customer", "customers", "sales" -> "customer";
            case "supplier", "suppliers", "purchase" -> "supplier";
            default -> throw new AppException(ErrorCode.BAD_REQUEST, "Invalid assignment entity type", HttpStatus.BAD_REQUEST);
        };
    }

    private void ensureListSupportsEntityType(String schema, Long listId, String entityType) {
        List<Map<String, Object>> rows = jdbc.queryForList(String.format("""
            SELECT price_list_type
            FROM "%s".price_lists
            WHERE id = ?
              AND deleted_at IS NULL
            LIMIT 1
            """, schema), listId);
        if (rows.isEmpty()) {
            throw new AppException(ErrorCode.NOT_FOUND, "Price list not found", HttpStatus.NOT_FOUND);
        }
        String type = String.valueOf(rows.get(0).get("price_list_type"));
        boolean supported = "both".equals(type)
                || ("customer".equals(entityType) && "sales".equals(type))
                || ("supplier".equals(entityType) && "purchase".equals(type));
        if (!supported) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Price list type does not support this entity type", HttpStatus.BAD_REQUEST);
        }
    }

    private List<Long> normalizeIds(List<Long> ids) {
        Set<Long> unique = new LinkedHashSet<>();
        if (ids != null) {
            ids.stream()
                    .filter(id -> id != null && id > 0)
                    .forEach(unique::add);
        }
        return new ArrayList<>(unique);
    }

    private String placeholders(int count) {
        return String.join(", ", java.util.Collections.nCopies(count, "?"));
    }

    private void ensureAssignmentColumns(String schema) {
        if (!assignmentColumnsReady.add(schema)) {
            return;
        }

        jdbc.execute(String.format("""
            ALTER TABLE "%1$s".customers
                ADD COLUMN IF NOT EXISTS price_list_id bigint REFERENCES "%1$s".price_lists(id);
            ALTER TABLE "%1$s".suppliers
                ADD COLUMN IF NOT EXISTS price_list_id bigint REFERENCES "%1$s".price_lists(id);
            CREATE INDEX IF NOT EXISTS idx_customers_price_list ON "%1$s".customers(price_list_id);
            CREATE INDEX IF NOT EXISTS idx_suppliers_price_list ON "%1$s".suppliers(price_list_id);
            """, schema));
    }

    private BigDecimal findExistingItemPrice(String schema, Long listId, Long productId) {
        var values = jdbc.query(String.format("""
            SELECT unit_price_amount
            FROM "%s".price_list_items
            WHERE price_list_id = ? AND product_id = ? AND min_qty = 1
            """, schema), (rs, rowNum) -> rs.getBigDecimal("unit_price_amount"), listId, productId);
        return values.isEmpty() ? null : values.get(0);
    }

    private void ensureListExists(String schema, Long listId) {
        Integer count = jdbc.queryForObject(String.format("""
            SELECT count(*)
            FROM "%s".price_lists
            WHERE id = ? AND deleted_at IS NULL
            """, schema), Integer.class, listId);
        if (count == null || count == 0) {
            throw new AppException(ErrorCode.NOT_FOUND, "Price list not found", HttpStatus.NOT_FOUND);
        }
    }

    private void ensureProductExists(String schema, Long productId) {
        Integer count = jdbc.queryForObject(String.format("""
            SELECT count(*)
            FROM "%s".products
            WHERE id = ? AND deleted_at IS NULL
            """, schema), Integer.class, productId);
        if (count == null || count == 0) {
            throw new AppException(ErrorCode.NOT_FOUND, "Product not found", HttpStatus.NOT_FOUND);
        }
    }

    private boolean priceChanged(BigDecimal before, BigDecimal after) {
        if (before == null && after == null) return false;
        if (before == null || after == null) return true;
        return before.compareTo(after) != 0;
    }

    private Long extractUserId(Authentication auth) {
        if (auth instanceof UsernamePasswordAuthenticationToken t
                && t.getDetails() instanceof Claims claims) {
            return claims.get("userId", Long.class);
        }
        return null;
    }

    private Long longValue(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.longValue();
        return Long.valueOf(value.toString());
    }
}
