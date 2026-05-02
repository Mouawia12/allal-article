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
    void submitRequest_createsPendingPartnershipAndConsumesInvite() {
        when(jdbc.queryForObject(
                eq("select id from platform.tenants where schema_name = ?"),
                eq(Long.class),
                eq("tenant_abcdef123456"))).thenReturn(8L);
        when(jdbc.queryForMap(contains("from platform.tenant_invite_codes"), anyString()))
                .thenReturn(Map.of(
                        "id", 55L,
                        "provider_tenant_id", 7L,
                        "permissions_json", "{\"view_inventory\":true,\"clone_products\":true}"));
        when(jdbc.queryForObject(
                contains("insert into platform.tenant_partnerships"),
                eq(Long.class),
                eq(7L),
                eq(8L),
                eq(55L),
                anyString(),
                eq("نريد تجربة الربط"))).thenReturn(66L);

        Map<String, Object> result = service.submitRequest(Map.of(
                "code", "link-abcd-efgh",
                "message", "نريد تجربة الربط"));

        assertThat(result)
                .containsEntry("id", 66L)
                .containsEntry("status", "pending")
                .containsEntry("providerTenantId", 7L);
        verify(jdbc).update(
                eq("update platform.tenant_invite_codes set uses_count = uses_count + 1 where id = ?"),
                eq(55L));
    }

    @Test
    void submitRequest_rejectsMissingCodeWithoutQueryingInvite() {
        when(jdbc.queryForObject(
                eq("select id from platform.tenants where schema_name = ?"),
                eq(Long.class),
                eq("tenant_abcdef123456"))).thenReturn(8L);

        assertThatThrownBy(() -> service.submitRequest(Map.of()))
                .isInstanceOfSatisfying(AppException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo(ErrorCode.BAD_REQUEST);
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                });

        verify(jdbc, never()).queryForMap(contains("from platform.tenant_invite_codes"), anyString());
    }

    @Test
    void approveRequest_activatesPendingRequestWithReviewedPermissions() {
        when(jdbc.queryForObject(
                eq("select id from platform.tenants where schema_name = ?"),
                eq(Long.class),
                eq("tenant_abcdef123456"))).thenReturn(7L);
        when(jdbc.update(
                contains("update platform.tenant_partnerships"),
                anyString(),
                eq("confirmed"),
                eq(66L),
                eq(7L))).thenReturn(1);

        service.approveRequest(66L, Map.of(
                "supplierLinkDecision", "accepted",
                "permissions", Map.of("view_inventory", true, "clone_products", true)));

        verify(jdbc).update(
                contains("update platform.tenant_partnerships"),
                anyString(),
                eq("confirmed"),
                eq(66L),
                eq(7L));
    }

    @Test
    void approveRequest_returnsNotFoundWhenRequestDoesNotBelongToProvider() {
        when(jdbc.queryForObject(
                eq("select id from platform.tenants where schema_name = ?"),
                eq(Long.class),
                eq("tenant_abcdef123456"))).thenReturn(7L);
        when(jdbc.update(
                contains("update platform.tenant_partnerships"),
                anyString(),
                eq("none"),
                eq(66L),
                eq(7L))).thenReturn(0);

        assertThatThrownBy(() -> service.approveRequest(66L, Map.of("permissions", Map.of())))
                .isInstanceOfSatisfying(AppException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo(ErrorCode.NOT_FOUND);
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                });
    }

    @Test
    void rejectRequest_marksPendingRequestRejected() {
        when(jdbc.queryForObject(
                eq("select id from platform.tenants where schema_name = ?"),
                eq(Long.class),
                eq("tenant_abcdef123456"))).thenReturn(7L);
        when(jdbc.update(
                contains("set status = 'rejected'"),
                eq(66L),
                eq(7L))).thenReturn(1);

        service.rejectRequest(66L);

        verify(jdbc).update(
                contains("set status = 'rejected'"),
                eq(66L),
                eq(7L));
    }

    @Test
    void revokePartnership_marksActivePartnershipRevokedForEitherSide() {
        when(jdbc.queryForObject(
                eq("select id from platform.tenants where schema_name = ?"),
                eq(Long.class),
                eq("tenant_abcdef123456"))).thenReturn(8L);
        when(jdbc.update(
                contains("set status = 'revoked'"),
                eq(66L),
                eq(8L),
                eq(8L))).thenReturn(1);

        service.revokePartnership(66L);

        verify(jdbc).update(
                contains("set status = 'revoked'"),
                eq(66L),
                eq(8L),
                eq(8L));
    }

    @Test
    void updatePermissions_allowsParticipantToReplaceActivePartnershipPermissions() {
        when(jdbc.queryForObject(
                eq("select id from platform.tenants where schema_name = ?"),
                eq(Long.class),
                eq("tenant_abcdef123456"))).thenReturn(7L);
        when(jdbc.update(
                contains("set permissions_json = ?::jsonb"),
                anyString(),
                eq(66L),
                eq(7L),
                eq(7L))).thenReturn(1);

        service.updatePermissions(66L, Map.of("permissions", Map.of(
                "view_inventory", true,
                "view_pricing", true,
                "create_purchase_link", true)));

        verify(jdbc).update(
                contains("set permissions_json = ?::jsonb"),
                anyString(),
                eq(66L),
                eq(7L),
                eq(7L));
    }

    @Test
    void updatePermissions_returnsNotFoundWhenCurrentTenantIsNotParticipant() {
        when(jdbc.queryForObject(
                eq("select id from platform.tenants where schema_name = ?"),
                eq(Long.class),
                eq("tenant_abcdef123456"))).thenReturn(8L);
        when(jdbc.update(
                contains("set permissions_json = ?::jsonb"),
                anyString(),
                eq(66L),
                eq(8L),
                eq(8L))).thenReturn(0);

        assertThatThrownBy(() -> service.updatePermissions(66L, Map.of("permissions", Map.of("view_inventory", true))))
                .isInstanceOfSatisfying(AppException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo(ErrorCode.NOT_FOUND);
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                });
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

    @Test
    void cloneProducts_copiesSelectedPartnerProductsWhenPermissionIsGranted() {
        String partnerUuid = "11111111-1111-1111-1111-111111111111";
        when(jdbc.queryForObject(
                eq("select id from platform.tenants where schema_name = ?"),
                eq(Long.class),
                eq("tenant_abcdef123456"))).thenReturn(8L);
        when(jdbc.queryForMap(contains("from platform.tenant_partnerships"), eq(8L), eq(partnerUuid)))
                .thenReturn(Map.of(
                        "permissions_json", "{\"clone_products\":true,\"view_pricing\":true}",
                        "partner_uuid", partnerUuid,
                        "partner_name", "Partner SARL",
                        "partner_schema", "tenant_111111111111"));
        when(jdbc.update(
                contains("insert into \"tenant_abcdef123456\".categories"),
                eq(12L),
                eq(13L))).thenReturn(1);
        when(jdbc.update(
                contains("insert into \"tenant_abcdef123456\".product_units_catalog"),
                eq(12L),
                eq(13L))).thenReturn(1);
        when(jdbc.queryForObject(
                contains("select count(*) from upserted"),
                eq(Integer.class),
                eq(true),
                eq(12L),
                eq(13L))).thenReturn(2);

        Map<String, Object> result = service.cloneProducts(partnerUuid, Map.of("productIds", java.util.List.of(12, 13)));

        assertThat(result).containsEntry("clonedCount", 2);
    }

    @Test
    void cloneProducts_rejectsEmptySelectionBeforeWritingAnything() {
        String partnerUuid = "11111111-1111-1111-1111-111111111111";
        when(jdbc.queryForObject(
                eq("select id from platform.tenants where schema_name = ?"),
                eq(Long.class),
                eq("tenant_abcdef123456"))).thenReturn(8L);
        when(jdbc.queryForMap(contains("from platform.tenant_partnerships"), eq(8L), eq(partnerUuid)))
                .thenReturn(Map.of(
                        "permissions_json", "{\"clone_products\":true}",
                        "partner_uuid", partnerUuid,
                        "partner_name", "Partner SARL",
                        "partner_schema", "tenant_111111111111"));

        assertThatThrownBy(() -> service.cloneProducts(partnerUuid, Map.of("productIds", java.util.List.of())))
                .isInstanceOfSatisfying(AppException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo(ErrorCode.BAD_REQUEST);
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                });

        verify(jdbc, never()).update(contains("insert into \"tenant_abcdef123456\".categories"), eq(12L));
    }
}
