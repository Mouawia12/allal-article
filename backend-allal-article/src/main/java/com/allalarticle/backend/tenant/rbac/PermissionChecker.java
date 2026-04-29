package com.allalarticle.backend.tenant.rbac;

import com.allalarticle.backend.tenant.TenantContext;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service("permChecker")
@RequiredArgsConstructor
public class PermissionChecker {

    private final JdbcTemplate jdbc;

    public boolean hasPermission(Authentication auth, String permissionCode) {
        if (auth == null || !auth.isAuthenticated()) return false;
        if (!(auth instanceof UsernamePasswordAuthenticationToken token)) return false;
        if (!(token.getDetails() instanceof Claims claims)) return false;

        String schema = claims.get("schema", String.class);
        if (!TenantContext.isValidSchema(schema)) return false;

        Long userId = claims.get("userId", Long.class);
        if (userId == null) return false;

        String sql = String.format("""
            SELECT COUNT(*) FROM "%s".permissions p
            WHERE p.code = ?
            AND (
                EXISTS (
                    SELECT 1 FROM "%s".role_permissions rp
                    JOIN "%s".users u ON u.primary_role_id = rp.role_id
                    WHERE u.id = ? AND rp.permission_id = p.id
                )
                OR EXISTS (
                    SELECT 1 FROM "%s".user_permissions up
                    WHERE up.user_id = ? AND up.permission_id = p.id AND up.effect = 'allow'
                )
            )
            AND NOT EXISTS (
                SELECT 1 FROM "%s".user_permissions up
                WHERE up.user_id = ? AND up.permission_id = p.id AND up.effect = 'deny'
            )
            """, schema, schema, schema, schema, schema, schema);

        Integer count = jdbc.queryForObject(sql, Integer.class,
                permissionCode, userId, userId, userId);
        return count != null && count > 0;
    }
}
