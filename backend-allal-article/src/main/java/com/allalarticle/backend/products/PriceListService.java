package com.allalarticle.backend.products;

import com.allalarticle.backend.tenant.TenantContext;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PriceListService {

    private final JdbcTemplate jdbc;

    public List<Map<String, Object>> listAll() {
        String s = schema();
        return jdbc.queryForList(String.format("""
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
            LEFT JOIN "%s".product_units pu ON pu.id = p.base_unit_id
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
        BigDecimal previousPrice = findExistingItemPrice(s, listId, productId);
        Long itemId = jdbc.queryForObject(String.format("""
            INSERT INTO "%s".price_list_items (price_list_id, product_id, unit_price_amount)
            VALUES (?, ?, ?)
            ON CONFLICT (price_list_id, product_id, min_qty) DO UPDATE
              SET unit_price_amount = EXCLUDED.unit_price_amount, updated_at = now()
            RETURNING id
            """, s), Long.class, listId, productId, unitPrice);

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
                    currency != null ? currency : "DZD", extractUserId(auth),
                    previousPrice == null ? "سعر ابتدائي في قائمة أسعار" : "تعديل سعر قائمة أسعار",
                    itemId);
        }
    }

    private String schema() {
        String s = TenantContext.get();
        if (s == null || s.isBlank()) throw new IllegalStateException("No tenant context");
        return s;
    }

    private BigDecimal findExistingItemPrice(String schema, Long listId, Long productId) {
        var values = jdbc.query(String.format("""
            SELECT unit_price_amount
            FROM "%s".price_list_items
            WHERE price_list_id = ? AND product_id = ? AND min_qty = 1
            """, schema), (rs, rowNum) -> rs.getBigDecimal("unit_price_amount"), listId, productId);
        return values.isEmpty() ? null : values.get(0);
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
}
