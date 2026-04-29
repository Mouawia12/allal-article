package com.allalarticle.backend.auth;

import com.allalarticle.backend.tenant.TenantContext;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Locale;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);
        if (!jwtService.isValid(token)) {
            chain.doFilter(request, response);
            return;
        }

        Claims claims = jwtService.parseToken(token);
        String email    = claims.getSubject();
        String roleCode = claims.get("roleCode", String.class);
        String type     = claims.get("type", String.class);
        String schema   = claims.get("schema", String.class);

        if (!isValidClaims(email, roleCode, type, schema)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        String normalizedRole = roleCode.trim().toUpperCase(Locale.ROOT);
        List<SimpleGrantedAuthority> authorities = "tenant".equals(type)
                ? List.of(
                        new SimpleGrantedAuthority("ROLE_TENANT"),
                        new SimpleGrantedAuthority("ROLE_" + normalizedRole))
                : List.of(
                        new SimpleGrantedAuthority("ROLE_PLATFORM"),
                        new SimpleGrantedAuthority("ROLE_PLATFORM_" + normalizedRole));

        var auth = new UsernamePasswordAuthenticationToken(
                email, null, authorities);
        auth.setDetails(claims);
        SecurityContextHolder.getContext().setAuthentication(auth);

        if (schema != null && !schema.isBlank()) {
            TenantContext.set(schema);
        }

        try {
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private boolean isValidClaims(String email, String roleCode, String type, String schema) {
        if (email == null || email.isBlank() || roleCode == null || roleCode.isBlank()) {
            return false;
        }
        if ("tenant".equals(type)) {
            return TenantContext.isValidSchema(schema);
        }
        return "platform".equals(type) && (schema == null || schema.isBlank());
    }
}
