package com.allalarticle.backend.auth.tenant;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

@RequiredArgsConstructor
public class TenantUserDetailsService implements UserDetailsService {

    private final JdbcTemplate jdbc;
    private final String schema;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        String sql = String.format(
            "SELECT u.id, u.email, u.password_hash, r.code AS role_code, u.status " +
            "FROM \"%s\".users u " +
            "JOIN \"%s\".roles r ON r.id = u.primary_role_id " +
            "WHERE u.email = ? AND u.deleted_at IS NULL",
            schema, schema
        );
        try {
            return jdbc.queryForObject(sql, (rs, rowNum) -> new TenantUserDetails(
                rs.getLong("id"),
                rs.getString("email"),
                rs.getString("password_hash"),
                rs.getString("role_code"),
                rs.getString("status"),
                schema
            ), email);
        } catch (EmptyResultDataAccessException e) {
            throw new UsernameNotFoundException("Tenant user not found: " + email);
        }
    }
}
