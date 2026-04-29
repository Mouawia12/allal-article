package com.allalarticle.backend.auth;

import com.allalarticle.backend.tenant.TenantContext;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthFilterTest {

    @Mock
    private JwtService jwtService;

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilterInternal_rejectsTenantTokenWithInvalidSchemaClaim() throws Exception {
        JwtAuthFilter filter = new JwtAuthFilter(jwtService);
        MockHttpServletRequest request = requestWithToken();
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = (req, res) -> {
            throw new AssertionError("Filter chain should not continue for invalid tenant claims");
        };

        when(jwtService.isValid("token")).thenReturn(true);
        when(jwtService.parseToken("token")).thenReturn(claims("tenant", "tenant_bad"));

        filter.doFilterInternal(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(TenantContext.get()).isNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void doFilterInternal_setsAndClearsTenantContextForValidTenantToken() throws Exception {
        JwtAuthFilter filter = new JwtAuthFilter(jwtService);
        MockHttpServletRequest request = requestWithToken();
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean chainCalled = new AtomicBoolean(false);
        FilterChain chain = (req, res) -> {
            chainCalled.set(true);
            assertThat(TenantContext.get()).isEqualTo("tenant_abcdef123456");
            var auth = SecurityContextHolder.getContext().getAuthentication();
            assertThat(auth).isNotNull();
            assertThat(auth.getAuthorities())
                    .extracting(authority -> authority.getAuthority())
                    .contains("ROLE_TENANT", "ROLE_ADMIN");
        };

        when(jwtService.isValid("token")).thenReturn(true);
        when(jwtService.parseToken("token")).thenReturn(claims("tenant", "tenant_abcdef123456"));

        filter.doFilterInternal(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(chainCalled).isTrue();
        assertThat(TenantContext.get()).isNull();
    }

    @Test
    void doFilterInternal_addsPlatformMarkerAuthorityWithoutTenantContext() throws Exception {
        JwtAuthFilter filter = new JwtAuthFilter(jwtService);
        MockHttpServletRequest request = requestWithToken();
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean chainCalled = new AtomicBoolean(false);
        FilterChain chain = (req, res) -> {
            chainCalled.set(true);
            assertThat(TenantContext.get()).isNull();
            var auth = SecurityContextHolder.getContext().getAuthentication();
            assertThat(auth).isNotNull();
            assertThat(auth.getAuthorities())
                    .extracting(authority -> authority.getAuthority())
                    .contains("ROLE_PLATFORM", "ROLE_PLATFORM_ADMIN")
                    .doesNotContain("ROLE_TENANT");
        };

        when(jwtService.isValid("token")).thenReturn(true);
        when(jwtService.parseToken("token")).thenReturn(claims("platform", null));

        filter.doFilterInternal(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(chainCalled).isTrue();
    }

    @Test
    void doFilterInternal_ignoresInvalidToken() throws Exception {
        JwtAuthFilter filter = new JwtAuthFilter(jwtService);
        MockHttpServletRequest request = requestWithToken();
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean chainCalled = new AtomicBoolean(false);
        FilterChain chain = (req, res) -> chainCalled.set(true);

        when(jwtService.isValid("token")).thenReturn(false);

        filter.doFilterInternal(request, response, chain);

        assertThat(chainCalled).isTrue();
        verify(jwtService, never()).parseToken("token");
    }

    private MockHttpServletRequest requestWithToken() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer token");
        return request;
    }

    private Claims claims(String type, String schema) {
        var builder = Jwts.claims()
                .subject("user@example.com")
                .add("roleCode", "admin")
                .add("type", type);
        if (schema != null) {
            builder.add("schema", schema);
        }
        return builder.build();
    }
}
