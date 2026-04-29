package com.allalarticle.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds the platform owner account on first startup.
 * Password is taken from platform.owner.password or PLATFORM_OWNER_PASSWORD,
 * defaulting to a placeholder that must be changed before production.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    private static final String DEFAULT_OWNER_EMAIL    = "owner@allal.dz";
    private static final String DEFAULT_OWNER_NAME     = "مالك المنصة";
    private static final String OWNER_PASSWORD_PROPERTY = "platform.owner.password";
    private static final String ENV_PASSWORD_KEY       = "PLATFORM_OWNER_PASSWORD";
    private static final String FALLBACK_PASSWORD      = "ChangeMe@2026!";

    @Override
    public void run(ApplicationArguments args) {
        seedPlatformOwner();
    }

    private void seedPlatformOwner() {
        Integer count = jdbcTemplate.queryForObject(
            "select count(*) from platform.platform_users where role_code = 'owner'",
            Integer.class
        );

        if (count != null && count > 0) {
            log.debug("Platform owner already exists — skipping seed.");
            return;
        }

        String password = environment.getProperty(OWNER_PASSWORD_PROPERTY);
        if (password == null || password.isBlank()) {
            password = System.getenv(ENV_PASSWORD_KEY);
        }
        if (password == null || password.isBlank()) {
            password = FALLBACK_PASSWORD;
            log.warn("PLATFORM_OWNER_PASSWORD env var not set. Using default password — change it immediately!");
        }

        String hash = passwordEncoder.encode(password);

        jdbcTemplate.update(
            """
            insert into platform.platform_users (name, email, password_hash, role_code, status)
            values (?, ?, ?, 'owner', 'active')
            """,
            DEFAULT_OWNER_NAME, DEFAULT_OWNER_EMAIL, hash
        );

        log.info("Platform owner seeded: {}", DEFAULT_OWNER_EMAIL);
    }
}
