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
import org.springframework.jdbc.core.RowMapper;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PriceListServiceTest {

    @Mock JdbcTemplate jdbc;

    private PriceListService service;

    @BeforeEach
    void setUp() {
        TenantContext.set("tenant_abcdef123456");
        service = new PriceListService(jdbc);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void listItems_joinsProductUnitsCatalog() {
        when(jdbc.queryForList(contains("product_units_catalog"), eq(1L)))
                .thenReturn(List.of(Map.of(
                        "product_id", 10L,
                        "product_name", "صنف",
                        "unit", "قطعة",
                        "base_price", 1000
                )));

        var items = service.listItems(1L);

        assertThat(items).hasSize(1);
        assertThat(items.get(0)).containsEntry("unit", "قطعة");
    }

    @Test
    void upsertItem_reactivatesExistingInactiveItem() {
        when(jdbc.queryForObject(contains("price_lists"), eq(Integer.class), eq(1L))).thenReturn(1);
        when(jdbc.queryForObject(contains("products"), eq(Integer.class), eq(10L))).thenReturn(1);
        when(jdbc.query(
                contains("SELECT unit_price_amount"),
                org.mockito.ArgumentMatchers.<RowMapper<BigDecimal>>any(),
                eq(1L), eq(10L)))
                .thenReturn(List.of());
        when(jdbc.queryForObject(
                argThat(sql -> sql.contains("ON CONFLICT") && sql.contains("is_active = true")),
                eq(Long.class),
                eq(1L), eq(10L), eq(new BigDecimal("850")), isNull(), isNull()))
                .thenReturn(100L);
        when(jdbc.queryForObject(contains("SELECT currency"), eq(String.class), eq(1L))).thenReturn("DZD");

        service.upsertItem(1L, 10L, new BigDecimal("850"), null);

        verify(jdbc).queryForObject(
                argThat(sql -> sql.contains("ON CONFLICT") && sql.contains("is_active = true")),
                eq(Long.class),
                eq(1L), eq(10L), eq(new BigDecimal("850")), isNull(), isNull());
    }

    @Test
    void upsertItem_rejectsNegativePrice() {
        assertThatThrownBy(() -> service.upsertItem(1L, 10L, new BigDecimal("-1"), null))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Price cannot be negative");
    }

    @Test
    void removeItem_deactivatesPriceListItem() {
        when(jdbc.update(
                argThat(sql -> sql.contains("price_list_items") && sql.contains("is_active = false")),
                eq(1L), eq(10L)))
                .thenReturn(1);

        service.removeItem(1L, 10L);

        verify(jdbc).update(
                argThat(sql -> sql.contains("price_list_items") && sql.contains("is_active = false")),
                eq(1L), eq(10L));
    }

    @Test
    void removeItem_withoutActiveItemThrowsNotFound() {
        when(jdbc.update(contains("price_list_items"), eq(1L), eq(10L))).thenReturn(0);

        assertThatThrownBy(() -> service.removeItem(1L, 10L))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("Price list item not found");
    }

    @Test
    void saveAssignments_persistsCustomerDefaultPriceList() {
        when(jdbc.queryForList(contains("price_lists"), eq(5L)))
                .thenReturn(List.of(Map.of("price_list_type", "sales")));
        when(jdbc.queryForObject(contains("customers"), eq(Integer.class), eq(10L), eq(11L)))
                .thenReturn(2);
        when(jdbc.update(contains("SET price_list_id = NULL"), eq(5L))).thenReturn(1);
        when(jdbc.update(contains("SET price_list_id = ?"), eq(5L), eq(10L), eq(11L))).thenReturn(2);
        when(jdbc.queryForList(contains("FROM \"tenant_abcdef123456\".customers"), eq(Long.class), eq(5L)))
                .thenReturn(List.of(10L, 11L));

        var result = service.saveAssignments(5L, "customer", List.of(10L, 10L, 11L));

        assertThat(result.get("entityType")).isEqualTo("customer");
        assertThat(result.get("assignedIds")).isEqualTo(List.of(10L, 11L));
        assertThat(result.get("assignedCount")).isEqualTo(2);
    }
}
