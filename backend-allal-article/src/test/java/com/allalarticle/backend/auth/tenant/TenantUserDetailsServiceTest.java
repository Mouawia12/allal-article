package com.allalarticle.backend.auth.tenant;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

class TenantUserDetailsServiceTest {

    @Test
    void constructor_rejectsInvalidSchemaBeforeAnyQueryCanRun() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);

        assertThatThrownBy(() -> new TenantUserDetailsService(jdbc, "tenant_bad"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid tenant schema");

        verifyNoInteractions(jdbc);
    }
}
