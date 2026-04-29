package com.allalarticle.backend.partnerships;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.tenant.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PartnershipServiceTest {

    @Mock
    private JdbcTemplate jdbc;

    private PartnershipService service;

    @BeforeEach
    void setUp() {
        service = new PartnershipService(jdbc, new ObjectMapper());
        TenantContext.set("tenant_abcdef123456");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void createInviteCode_generatesPlainCodeButStoresOnlyHash() {
        when(jdbc.queryForObject(
                eq("select id from platform.tenants where schema_name = ?"),
                eq(Long.class),
                eq("tenant_abcdef123456"))).thenReturn(7L);
        when(jdbc.queryForObject(
                contains("insert into platform.tenant_invite_codes"),
                eq(Long.class),
                eq(7L),
                anyString(),
                eq("Distributors"),
                anyString(),
                eq(3),
                eq("2026-05-15"))).thenReturn(44L);

        Map<String, Object> result = service.createInviteCode(Map.of(
                "label", "Distributors",
                "maxUses", 3,
                "expiresAt", "2026-05-15",
                "permissions", Map.of("view_inventory", true)));

        assertThat(result.get("id")).isEqualTo(44L);
        assertThat(result.get("code").toString()).matches("LINK-[A-Z2-9]{4}-[A-Z2-9]{4}");

        ArgumentCaptor<String> storedHash = ArgumentCaptor.forClass(String.class);
        verify(jdbc).queryForObject(
                contains("insert into platform.tenant_invite_codes"),
                eq(Long.class),
                eq(7L),
                storedHash.capture(),
                eq("Distributors"),
                anyString(),
                eq(3),
                eq("2026-05-15"));
        assertThat(storedHash.getValue())
                .hasSize(64)
                .doesNotContain("LINK-");
    }

    @Test
    void submitRequest_rejectsUnknownInviteCode() {
        when(jdbc.queryForObject(
                eq("select id from platform.tenants where schema_name = ?"),
                eq(Long.class),
                eq("tenant_abcdef123456"))).thenReturn(8L);
        when(jdbc.queryForMap(contains("from platform.tenant_invite_codes"), anyString()))
                .thenThrow(new EmptyResultDataAccessException(1));

        assertThatThrownBy(() -> service.submitRequest(Map.of("code", "LINK-ABCD-EFGH")))
                .isInstanceOfSatisfying(AppException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo(ErrorCode.NOT_FOUND);
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                });
    }

    @Test
    void submitRequest_rejectsOwnInviteCodeBeforeCreatingPartnership() {
        when(jdbc.queryForObject(
                eq("select id from platform.tenants where schema_name = ?"),
                eq(Long.class),
                eq("tenant_abcdef123456"))).thenReturn(8L);
        when(jdbc.queryForMap(contains("from platform.tenant_invite_codes"), anyString()))
                .thenReturn(Map.of(
                        "id", 55L,
                        "provider_tenant_id", 8L,
                        "permissions_json", "{\"view_inventory\":true}"));

        assertThatThrownBy(() -> service.submitRequest(Map.of("code", "LINK-ABCD-EFGH")))
                .isInstanceOfSatisfying(AppException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo(ErrorCode.BAD_REQUEST);
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                });

        verifyNoMoreInteractions(jdbc);
    }

    @Test
    void linkedInventory_readsPartnerSchemaOnlyWhenPermissionIsGranted() {
        String partnerUuid = "11111111-1111-1111-1111-111111111111";
        when(jdbc.queryForObject(
                eq("select id from platform.tenants where schema_name = ?"),
                eq(Long.class),
                eq("tenant_abcdef123456"))).thenReturn(8L);
        when(jdbc.queryForMap(contains("from platform.tenant_partnerships"), eq(8L), eq(partnerUuid)))
                .thenReturn(Map.of(
                        "permissions_json", "{\"view_inventory\":true,\"view_pricing\":true}",
                        "partner_uuid", partnerUuid,
                        "partner_name", "Partner SARL",
                        "partner_email", "partner@example.com",
                        "partner_wilaya", "16",
                        "partner_schema", "tenant_111111111111"));
        when(jdbc.queryForList(
                contains("from \"tenant_111111111111\".products"),
                eq(true),
                eq(false))).thenReturn(java.util.List.of(Map.of(
                        "id", 12L,
                        "product_uuid", "22222222-2222-2222-2222-222222222222",
                        "code", "SKU-1",
                        "name_ar", "منتج",
                        "category", "مواد",
                        "unit", "قطعة",
                        "stock", 9,
                        "price", 1500,
                        "monthly_sales", 0)));

        Map<String, Object> result = service.linkedInventory(partnerUuid);

        assertThat(result.get("products")).asList().hasSize(1);
        assertThat(((Map<?, ?>) result.get("permissions")).get("view_pricing")).isEqualTo(true);
    }

    @Test
    void linkedInventory_deniesWhenPartnershipPermissionIsMissing() {
        String partnerUuid = "11111111-1111-1111-1111-111111111111";
        when(jdbc.queryForObject(
                eq("select id from platform.tenants where schema_name = ?"),
                eq(Long.class),
                eq("tenant_abcdef123456"))).thenReturn(8L);
        when(jdbc.queryForMap(contains("from platform.tenant_partnerships"), eq(8L), eq(partnerUuid)))
                .thenReturn(Map.of(
                        "permissions_json", "{\"view_inventory\":false}",
                        "partner_uuid", partnerUuid,
                        "partner_name", "Partner SARL",
                        "partner_schema", "tenant_111111111111"));

        assertThatThrownBy(() -> service.linkedInventory(partnerUuid))
                .isInstanceOfSatisfying(AppException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo(ErrorCode.FORBIDDEN);
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                });

        verify(jdbc, never()).queryForList(contains(".products"), eq(false), eq(false));
    }
}
