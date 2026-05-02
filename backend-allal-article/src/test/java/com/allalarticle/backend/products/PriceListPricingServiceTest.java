package com.allalarticle.backend.products;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PriceListPricingServiceTest {

    @Mock JdbcTemplate jdbc;

    private PriceListPricingService service;

    @BeforeEach
    void setUp() {
        TenantContext.set("tenant_abcdef123456");
        service = new PriceListPricingService(jdbc);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void resolvePrice_withMainFallback_usesProductDefaultWithoutQuerying() {
        var resolved = service.resolvePrice(
                "MAIN", "sales", 10L, new BigDecimal("4"),
                new BigDecimal("1000"), "DZD");

        assertThat(resolved.priceListId()).isNull();
        assertThat(resolved.priceListItemId()).isNull();
        assertThat(resolved.unitPrice()).isEqualByComparingTo("1000");
        assertThat(resolved.pricingSource()).isEqualTo("product_default");
        verifyNoInteractions(jdbc);
    }

    @Test
    void resolvePrice_withActiveItem_usesPriceListAmount() {
        when(jdbc.queryForList(contains("price_lists"), eq(5L), eq("sales")))
                .thenReturn(List.of(Map.of(
                        "id", 5L,
                        "name", "أسعار الجملة",
                        "currency", "DZD"
                )));
        when(jdbc.queryForList(contains("price_list_items"), eq(5L), eq(10L), eq(new BigDecimal("4"))))
                .thenReturn(List.of(Map.of(
                        "id", 50L,
                        "unit_price_amount", new BigDecimal("850")
                )));

        var resolved = service.resolvePrice(
                "5", "sales", 10L, new BigDecimal("4"),
                new BigDecimal("1000"), "DZD");

        assertThat(resolved.priceListId()).isEqualTo(5L);
        assertThat(resolved.priceListName()).isEqualTo("أسعار الجملة");
        assertThat(resolved.priceListItemId()).isEqualTo(50L);
        assertThat(resolved.baseUnitPrice()).isEqualByComparingTo("1000");
        assertThat(resolved.unitPrice()).isEqualByComparingTo("850");
        assertThat(resolved.pricingSource()).isEqualTo("price_list");
    }

    @Test
    void resolvePrice_withoutMatchingItem_keepsSelectedListAndFallsBackToProductDefault() {
        when(jdbc.queryForList(contains("price_lists"), eq("PL-RETAIL"), eq("sales")))
                .thenReturn(List.of(Map.of(
                        "id", 9L,
                        "name", "أسعار التجزئة",
                        "currency", "DZD"
                )));
        when(jdbc.queryForList(contains("price_list_items"), eq(9L), eq(10L), eq(BigDecimal.ONE)))
                .thenReturn(List.of());

        var resolved = service.resolvePrice(
                "PL-RETAIL", "sales", 10L, BigDecimal.ONE,
                new BigDecimal("1200"), "DZD");

        assertThat(resolved.priceListId()).isEqualTo(9L);
        assertThat(resolved.priceListName()).isEqualTo("أسعار التجزئة");
        assertThat(resolved.priceListItemId()).isNull();
        assertThat(resolved.unitPrice()).isEqualByComparingTo("1200");
        assertThat(resolved.pricingSource()).isEqualTo("product_default");
    }

    @Test
    void resolvePrice_withMissingList_throwsBadRequest() {
        when(jdbc.queryForList(contains("price_lists"), eq(77L), eq("purchase")))
                .thenReturn(List.of());

        assertThatThrownBy(() -> service.resolvePrice(
                "77", "purchase", 10L, BigDecimal.ONE,
                new BigDecimal("1000"), "DZD"))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Price list not found");
    }
}
