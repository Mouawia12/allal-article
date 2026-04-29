package com.allalarticle.backend.platform;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
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
}
