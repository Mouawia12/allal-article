package com.allalarticle.backend.auth.platform;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service("platformUserDetailsService")
@RequiredArgsConstructor
public class PlatformUserDetailsService implements UserDetailsService {

    private final JdbcTemplate jdbc;

    private static final String SQL =
        "SELECT id, email, password_hash, role_code, status " +
        "FROM platform.platform_users " +
        "WHERE email = ? AND deleted_at IS NULL";

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        try {
            return jdbc.queryForObject(SQL, (rs, rowNum) -> new PlatformUserDetails(
                rs.getLong("id"),
                rs.getString("email"),
                rs.getString("password_hash"),
                rs.getString("role_code"),
                rs.getString("status")
            ), email);
        } catch (EmptyResultDataAccessException e) {
            throw new UsernameNotFoundException("Platform user not found: " + email);
        }
    }
}
