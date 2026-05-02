package com.allalarticle.backend.platform;

import com.allalarticle.backend.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.FileCopyUtils;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
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

    private static final String[] TENANT_SCRIPTS = {
        "T01__roles_permissions.sql",
        "T02__users.sql",
        "T03__reference_data.sql",
        "T04__customers.sql",
        "T05__products.sql",
        "T06__pricing.sql",
        "T07__inventory.sql",
        "T08__manufacturing.sql",
        "T09__orders.sql",
        "T10__returns.sql",
        "T11__purchases.sql",
        "T12__road_invoices.sql",
        "T13__accounting.sql",
        "T14__notifications.sql",
        "T15__resource_locks.sql",
        "T16__ai_audit.sql",
        "T17__seed_roles_permissions.sql",
        "T18__seed_wilayas.sql",
        "T19__seed_reference_data.sql",
        "T20__seed_chart_of_accounts.sql",
        "T21__align_accounting_permissions.sql",
        "T22__align_journal_reference_columns.sql",
        "T23__align_accounting_defaults.sql",
        "T24__align_purchase_permissions.sql",
        "T25__align_purchase_order_item_timestamps.sql",
        "T26__email_notifications.sql",
        "T27__align_ai_settings_permissions.sql",
        "T28__price_list_entity_defaults.sql"
    };

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
            for (String script : TENANT_SCRIPTS) {
                executeSqlScript("db/migration/tenant/" + script, schemaName);
            }

            seedOwnerUser(schemaName, ownerName, ownerEmail, ownerPassword);
        } finally {
            jdbcTemplate.execute("set search_path to platform, public");
        }

        log.info("Tenant schema provisioned successfully: {}", schemaName);
    }

    private void executeSqlScript(String classpathLocation, String schemaName) {
        try {
            ClassPathResource resource = new ClassPathResource(classpathLocation);
            if (!resource.exists()) {
                log.warn("Tenant migration script not found: {}", classpathLocation);
                return;
            }
            try (Reader reader = new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8)) {
                String sql = FileCopyUtils.copyToString(reader);
                jdbcTemplate.execute(sql);
            }
            log.debug("Executed tenant script: {}", classpathLocation);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read tenant migration script: " + classpathLocation, e);
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
