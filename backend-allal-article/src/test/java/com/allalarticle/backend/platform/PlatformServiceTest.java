package com.allalarticle.backend.platform;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlatformServiceTest {

    @Mock
    private JdbcTemplate jdbc;

    @Mock
    private TenantSchemaService tenantSchemaService;

    @Mock
    private PasswordEncoder passwordEncoder;

    private PlatformService service;

    @BeforeEach
    void setUp() {
        service = new PlatformService(jdbc, tenantSchemaService, passwordEncoder);
    }

    private void stubCreateTenantQueries() {
        when(jdbc.queryForObject(
                eq("select id from platform.plans where code = ?"),
                eq(Long.class),
                eq("trial"))).thenReturn(10L);
        when(jdbc.queryForObject(
                contains("insert into platform.tenants"),
                eq(Long.class),
                any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(22L);
    }

    @Test
    void listTenants_usesBoundParametersForFilters() {
        when(jdbc.queryForList(anyString(), any(Object[].class))).thenReturn(List.of());

        service.listTenants("active", "o'hara");

        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Object[]> params = ArgumentCaptor.forClass(Object[].class);
        verify(jdbc).queryForList(sql.capture(), params.capture());

        assertThat(sql.getValue())
                .contains("t.status = ?")
                .contains("t.company_name ilike ?")
                .contains("t.contact_email ilike ?")
                .doesNotContain("o'hara");
        assertThat(params.getValue())
                .containsExactly("active", "%o'hara%", "%o'hara%");
    }

    @Test
    void getTenant_missingTenantThrowsNotFound() {
        when(jdbc.queryForMap(anyString(), eq(42L))).thenThrow(new EmptyResultDataAccessException(1));

        assertThatThrownBy(() -> service.getTenant(42L))
                .isInstanceOfSatisfying(AppException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo(ErrorCode.NOT_FOUND);
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                });
    }

    @Test
    void createTenant_invalidPlanCodeThrowsBadRequest() {
        when(jdbc.queryForObject(
                eq("select id from platform.plans where code = ?"),
                eq(Long.class),
                eq("missing"))).thenThrow(new EmptyResultDataAccessException(1));

        assertThatThrownBy(() -> service.createTenant(Map.of(
                "companyName", "Allal",
                "contactEmail", "owner@example.com",
                "planCode", "missing")))
                .isInstanceOfSatisfying(AppException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo(ErrorCode.BAD_REQUEST);
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(exception.getMessage()).isEqualTo("Invalid planCode");
                });
    }

    @Test
    void createTenant_createsSubscriptionAfterProvisioningSucceeds() {
        stubCreateTenantQueries();

        service.createTenant(Map.of(
                "companyName", "Allal",
                "contactEmail", "owner@example.com",
                "ownerPassword", "ChangeMe@2026!"));

        verify(tenantSchemaService).provision(
                anyString(),
                eq("Allal Admin"),
                eq("owner@example.com"),
                eq("ChangeMe@2026!"));
        verify(jdbc).update(
                contains("insert into platform.subscriptions"),
                eq(22L),
                eq("trial"),
                eq(10L));
    }

    @Test
    void createTenant_marksTenantFailedWhenProvisioningFails() {
        stubCreateTenantQueries();
        doThrow(new IllegalStateException("migration failed"))
                .when(tenantSchemaService)
                .provision(anyString(), anyString(), anyString(), anyString());

        assertThatThrownBy(() -> service.createTenant(Map.of(
                "companyName", "Allal",
                "contactEmail", "owner@example.com",
                "ownerPassword", "ChangeMe@2026!")))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("فشل تجهيز المستأجر");

        verify(jdbc).update("update platform.tenants set status='provisioning_failed' where id=?", 22L);
        verify(jdbc).update(
                contains("set status='failed'"),
                eq("migration failed"),
                eq(22L));
    }

    @Test
    void createTenant_generatesOwnerPasswordWhenMissing() {
        stubCreateTenantQueries();

        Map<String, Object> result = service.createTenant(Map.of(
                "companyName", "Allal",
                "contactEmail", "owner@example.com"));

        ArgumentCaptor<String> generatedPassword = ArgumentCaptor.forClass(String.class);
        verify(tenantSchemaService).provision(
                anyString(),
                eq("Allal Admin"),
                eq("owner@example.com"),
                generatedPassword.capture());

        assertThat(generatedPassword.getValue())
                .hasSize(20)
                .matches(".*[A-Z].*")
                .matches(".*[a-z].*")
                .matches(".*[0-9].*")
                .matches(".*[@#$%!].*");
        assertThat(result.get("ownerPassword")).isEqualTo(generatedPassword.getValue());
    }

    @Test
    void resetOwnerPassword_rejectsInvalidStoredSchemaBeforeHashingPassword() {
        when(jdbc.queryForObject(
                eq("select schema_name from platform.tenants where id = ?"),
                eq(String.class),
                eq(22L))).thenReturn("tenant_bad");

        assertThatThrownBy(() -> service.resetOwnerPassword(22L, "ChangeMe@2026!"))
                .isInstanceOfSatisfying(AppException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo(ErrorCode.INTERNAL_ERROR);
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
                });

        verify(passwordEncoder, never()).encode(anyString());
    }
}
