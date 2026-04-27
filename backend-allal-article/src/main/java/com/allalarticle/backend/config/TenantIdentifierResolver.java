package com.allalarticle.backend.config;

import com.allalarticle.backend.tenant.TenantContext;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Component;

@Component
public class TenantIdentifierResolver implements CurrentTenantIdentifierResolver<String> {

    private static final String DEFAULT = "public";

    @Override
    public String resolveCurrentTenantIdentifier() {
        String schema = TenantContext.get();
        return (schema != null && !schema.isBlank()) ? schema : DEFAULT;
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return true;
    }
}
