package com.allalarticle.backend.tenant;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TenantContextTest {

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void set_acceptsGeneratedTenantSchema() {
        TenantContext.set("tenant_abcdef123456");

        assertThat(TenantContext.get()).isEqualTo("tenant_abcdef123456");
    }

    @Test
    void set_rejectsInvalidSchema() {
        assertThatThrownBy(() -> TenantContext.set("tenant_bad"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid tenant schema");
    }
}
