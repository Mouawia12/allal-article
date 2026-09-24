package com.allalarticle.backend.platform;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class TenantSchemaServiceTest {

    @Mock
    private JdbcTemplate jdbc;

    @Mock
    private PasswordEncoder passwordEncoder;

    private TenantSchemaService service;

    @BeforeEach
    void setUp() {
        service = new TenantSchemaService(jdbc, passwordEncoder);
    }

    @Test
    void provision_resetsSearchPathWhenTenantMigrationFails() {
        doAnswer(invocation -> {
            String sql = invocation.getArgument(0);
            if (sql.startsWith("-- T01:")) {
                throw new DataAccessResourceFailureException("migration failed");
            }
            return null;
        }).when(jdbc).execute(anyString());

        assertThatThrownBy(() -> service.provision(
                "tenant_abcdef123456",
                "Owner",
                "owner@example.com",
                "ChangeMe@2026!"))
                .isInstanceOf(DataAccessResourceFailureException.class);

        verify(jdbc).execute("set search_path to platform, public");
    }

    /**
     * Guards the failure that broke the customers/suppliers pages: T29 existed on disk but was
     * missing from the hand-written script list, so the latitude/longitude columns were never
     * created and every query against those tables failed.
     */
    @Test
    void provision_runsEveryTenantScriptOnDisk_inFilenameOrder() throws Exception {
        service.provision("tenant_abcdef123456", "Owner", "owner@example.com", "ChangeMe@2026!");

        ArgumentCaptor<String> executedSql = ArgumentCaptor.forClass(String.class);
        verify(jdbc, atLeastOnce()).execute(executedSql.capture());
        List<String> executed = executedSql.getAllValues();

        Resource[] scripts = new PathMatchingResourcePatternResolver()
                .getResources("classpath*:db/migration/tenant/T*.sql");
        assertThat(scripts).isNotEmpty();
        Arrays.sort(scripts, Comparator.comparing(r -> Objects.requireNonNull(r.getFilename())));

        int previousPosition = -1;
        for (Resource script : scripts) {
            String body = new String(script.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            int position = executed.indexOf(body);
            assertThat(position)
                    .as("script %s must run during provisioning", script.getFilename())
                    .isGreaterThan(previousPosition);
            previousPosition = position;
        }
    }
}
