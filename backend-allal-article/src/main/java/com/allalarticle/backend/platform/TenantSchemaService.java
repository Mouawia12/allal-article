package com.allalarticle.backend.platform;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.FileCopyUtils;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Objects;
import java.util.UUID;

/**
 * Provisions a new tenant schema by running all tenant migration scripts in order.
 * Scripts are loaded from classpath:db/migration/tenant/ and executed in filename order.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TenantSchemaService {

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    /**
     * Every T*.sql in the tenant migration folder runs, ordered by filename. Discovering them
     * instead of listing them by hand means a newly added script can never be left unregistered.
     */
    private static final String TENANT_SCRIPT_PATTERN = "classpath*:db/migration/tenant/T*.sql";

    /**
     * Creates a new schema for the given tenant and runs all tenant migrations inside it.
     *
     * @param schemaName  safe schema name, e.g. "tenant_a1b2c3d4"
     * @param ownerName   full name of the tenant's first admin user
     * @param ownerEmail  email of the tenant's first admin user
     * @param ownerPassword plain-text password (will be hashed before insert)
     */
    @Transactional
    public void provision(String schemaName, String ownerName, String ownerEmail, String ownerPassword) {
        TenantContext.requireValidSchema(schemaName);
        log.info("Provisioning tenant schema: {}", schemaName);

        jdbcTemplate.execute("create schema if not exists \"" + schemaName + "\"");
        jdbcTemplate.execute("set search_path to \"" + schemaName + "\"");

        try {
            for (Resource script : resolveTenantScripts()) {
                executeSqlScript(script);
            }

            seedOwnerUser(schemaName, ownerName, ownerEmail, ownerPassword);
        } finally {
            jdbcTemplate.execute("set search_path to platform, public");
        }

        log.info("Tenant schema provisioned successfully: {}", schemaName);
    }

    private Resource[] resolveTenantScripts() {
        Resource[] scripts;
        try {
            scripts = new PathMatchingResourcePatternResolver().getResources(TENANT_SCRIPT_PATTERN);
        } catch (IOException e) {
            log.error("Failed to list tenant migration scripts", e);
            throw new AppException(ErrorCode.INTERNAL_ERROR,
                    "Failed to list tenant migration scripts",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
        if (scripts.length == 0) {
            throw new AppException(ErrorCode.INTERNAL_ERROR,
                    "No tenant migration scripts found on the classpath",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
        Arrays.sort(scripts, Comparator.comparing(r -> Objects.requireNonNull(r.getFilename())));
        log.info("Tenant migration scripts to run: {}", scripts.length);
        return scripts;
    }

    private void executeSqlScript(Resource resource) {
        String name = resource.getFilename();
        try (Reader reader = new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8)) {
            jdbcTemplate.execute(FileCopyUtils.copyToString(reader));
            log.debug("Executed tenant script: {}", name);
        } catch (IOException e) {
            log.error("Failed to read tenant migration script: {}", name, e);
            throw new AppException(ErrorCode.INTERNAL_ERROR,
                    "Failed to read tenant migration script: " + name,
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private void seedOwnerUser(String schemaName, String name, String email, String plainPassword) {
        String hash = passwordEncoder.encode(plainPassword);

        String sql = """
            insert into "%s".users (name, email, password_hash, user_type, status,
                primary_role_id)
            select ?, ?, ?, 'admin_user', 'active',
                   (select id from "%s".roles where code = 'owner')
            where not exists (select 1 from "%s".users where email = ?)
            """.formatted(schemaName, schemaName, schemaName);

        jdbcTemplate.update(sql, name, email, hash, email);
        log.info("Owner user seeded for schema {}: {}", schemaName, email);
    }

    /** Returns a safe, random schema name in format tenant_<12-hex-chars>. */
    public static String generateSchemaName() {
        return "tenant_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }
}
