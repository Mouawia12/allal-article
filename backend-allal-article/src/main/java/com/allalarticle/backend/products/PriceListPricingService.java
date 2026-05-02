package com.allalarticle.backend.products;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PriceListPricingService {

    private static final String DEFAULT_CURRENCY = "DZD";

    private final JdbcTemplate jdbc;

    public PriceResolution resolvePrice(
            String priceListRef,
            String priceListType,
            Long productId,
            BigDecimal qty,
            BigDecimal productDefaultPrice,
            String productCurrency) {
        BigDecimal basePrice = valueOrZero(productDefaultPrice);
        String fallbackCurrency = normalizeCurrency(productCurrency);
        PriceListSnapshot priceList = resolvePriceList(priceListRef, priceListType);

        if (priceList == null) {
            return PriceResolution.productDefault(basePrice, fallbackCurrency);
        }

        PriceListItemSnapshot item = findPriceListItem(priceList.id(), productId, qty);
        if (item != null && item.unitPriceAmount() != null
                && item.unitPriceAmount().compareTo(BigDecimal.ZERO) > 0) {
            return new PriceResolution(
                    priceList.id(),
                    priceList.name(),
                    normalizeCurrency(priceList.currency()),
                    item.id(),
                    basePrice,
                    item.unitPriceAmount(),
                    "price_list");
        }

        return new PriceResolution(
                priceList.id(),
                priceList.name(),
                normalizeCurrency(priceList.currency()),
                null,
                basePrice,
                basePrice,
                "product_default");
    }

    public PriceResolution applyManualOverrideIfNeeded(
            PriceResolution resolution,
            BigDecimal manualUnitPrice,
            BigDecimal productDefaultPrice,
            String productCurrency) {
        if (resolution.priceListId() != null || manualUnitPrice == null) {
            return resolution;
        }

        BigDecimal manualPrice = valueOrZero(manualUnitPrice);
        BigDecimal defaultPrice = valueOrZero(productDefaultPrice);
        if (manualPrice.compareTo(defaultPrice) == 0) {
            return resolution;
        }

        return PriceResolution.manualOverride(
                manualPrice,
                defaultPrice,
                normalizeCurrency(productCurrency));
    }

    private PriceListSnapshot resolvePriceList(String priceListRef, String priceListType) {
        if (isMainFallbackRef(priceListRef)) {
            return null;
        }

        String schema = schema();
        String normalized = priceListRef.trim();
        List<Map<String, Object>> rows;
        if (normalized.matches("\\d+")) {
            rows = jdbc.queryForList(String.format("""
                    SELECT id, name, currency
                    FROM "%s".price_lists
                    WHERE id = ?
                      AND is_active = true
                      AND deleted_at IS NULL
                      AND (price_list_type = ? OR price_list_type = 'both')
                    LIMIT 1
                    """, schema), Long.parseLong(normalized), priceListType);
        } else {
            rows = jdbc.queryForList(String.format("""
                    SELECT id, name, currency
                    FROM "%s".price_lists
                    WHERE code = ?
                      AND is_active = true
                      AND deleted_at IS NULL
                      AND (price_list_type = ? OR price_list_type = 'both')
                    LIMIT 1
                    """, schema), normalized, priceListType);
        }

        if (rows.isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Price list not found or inactive", HttpStatus.BAD_REQUEST);
        }

        Map<String, Object> row = rows.get(0);
        return new PriceListSnapshot(
                longValue(row.get("id")),
                stringValue(row.get("name")),
                stringValue(row.get("currency")));
    }

    private PriceListItemSnapshot findPriceListItem(Long priceListId, Long productId, BigDecimal qty) {
        String schema = schema();
        BigDecimal effectiveQty = qty != null && qty.compareTo(BigDecimal.ZERO) > 0 ? qty : BigDecimal.ONE;
        List<Map<String, Object>> rows = jdbc.queryForList(String.format("""
                SELECT id, unit_price_amount
                FROM "%s".price_list_items
                WHERE price_list_id = ?
                  AND product_id = ?
                  AND is_active = true
                  AND min_qty <= ?
                ORDER BY min_qty DESC, id DESC
                LIMIT 1
                """, schema), priceListId, productId, effectiveQty);

        if (rows.isEmpty()) {
            return null;
        }

        Map<String, Object> row = rows.get(0);
        return new PriceListItemSnapshot(
                longValue(row.get("id")),
                decimalValue(row.get("unit_price_amount")));
    }

    private boolean isMainFallbackRef(String priceListRef) {
        if (priceListRef == null || priceListRef.isBlank()) {
            return true;
        }
        String ref = priceListRef.trim();
        return "MAIN".equalsIgnoreCase(ref)
                || "DEFAULT".equalsIgnoreCase(ref)
                || "PURCHASE_MAIN".equalsIgnoreCase(ref);
    }

    private String schema() {
        String schema = TenantContext.get();
        if (!TenantContext.isValidSchema(schema)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Invalid tenant context", HttpStatus.BAD_REQUEST);
        }
        return schema;
    }

    private BigDecimal valueOrZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private String normalizeCurrency(String currency) {
        return currency != null && !currency.isBlank() ? currency : DEFAULT_CURRENCY;
    }

    private Long longValue(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.longValue();
        return Long.valueOf(value.toString());
    }

    private BigDecimal decimalValue(Object value) {
        if (value == null) return null;
        if (value instanceof BigDecimal decimal) return decimal;
        if (value instanceof Number number) return new BigDecimal(number.toString());
        return new BigDecimal(value.toString());
    }

    private String stringValue(Object value) {
        return value != null ? value.toString() : null;
    }

    public record PriceResolution(
            Long priceListId,
            String priceListName,
            String currency,
            Long priceListItemId,
            BigDecimal baseUnitPrice,
            BigDecimal unitPrice,
            String pricingSource
    ) {
        public static PriceResolution productDefault(BigDecimal basePrice, String currency) {
            BigDecimal price = basePrice != null ? basePrice : BigDecimal.ZERO;
            return new PriceResolution(null, null,
                    currency != null && !currency.isBlank() ? currency : DEFAULT_CURRENCY,
                    null, price, price, "product_default");
        }

        public static PriceResolution manualOverride(BigDecimal manualPrice, BigDecimal basePrice, String currency) {
            BigDecimal unitPrice = manualPrice != null ? manualPrice : BigDecimal.ZERO;
            BigDecimal defaultPrice = basePrice != null ? basePrice : BigDecimal.ZERO;
            return new PriceResolution(null, null,
                    currency != null && !currency.isBlank() ? currency : DEFAULT_CURRENCY,
                    null, defaultPrice, unitPrice, "manual_override");
        }
    }

    public record PriceListSnapshot(Long id, String name, String currency) {}

    public record PriceListItemSnapshot(Long id, BigDecimal unitPriceAmount) {}
}
