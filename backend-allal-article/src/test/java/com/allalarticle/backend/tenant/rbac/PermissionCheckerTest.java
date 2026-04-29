package com.allalarticle.backend.tenant.rbac;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class PermissionCheckerTest {

    @Test
    void hasPermission_rejectsInvalidSchemaClaimBeforeQuerying() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        PermissionChecker checker = new PermissionChecker(jdbc);

        boolean allowed = checker.hasPermission(auth(claims("tenant_bad", 7L)), "orders.view");

        assertThat(allowed).isFalse();
        verifyNoInteractions(jdbc);
    }

    @Test
    void hasPermission_rejectsMissingUserIdBeforeQuerying() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        PermissionChecker checker = new PermissionChecker(jdbc);

        boolean allowed = checker.hasPermission(auth(claims("tenant_abcdef123456", null)), "orders.view");

        assertThat(allowed).isFalse();
        verifyNoInteractions(jdbc);
    }

    @Test
    void hasPermission_queriesTenantSchemaForValidClaims() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        PermissionChecker checker = new PermissionChecker(jdbc);

        when(jdbc.queryForObject(
                anyString(),
                eq(Integer.class),
                eq("orders.view"),
                eq(7L),
                eq(7L),
                eq(7L))).thenReturn(1);

        boolean allowed = checker.hasPermission(auth(claims("tenant_abcdef123456", 7L)), "orders.view");

        assertThat(allowed).isTrue();
    }

    private Authentication auth(Claims claims) {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("user@example.com", null, List.of());
        auth.setDetails(claims);
        return auth;
    }

    private Claims claims(String schema, Long userId) {
        var builder = Jwts.claims()
                .add("schema", schema);
        if (userId != null) {
            builder.add("userId", userId);
        }
        return builder.build();
    }
}
