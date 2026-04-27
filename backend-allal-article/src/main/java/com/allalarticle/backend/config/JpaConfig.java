package com.allalarticle.backend.config;

import lombok.RequiredArgsConstructor;
import org.hibernate.cfg.AvailableSettings;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class JpaConfig {

    private final TenantConnectionProvider connectionProvider;
    private final TenantIdentifierResolver identifierResolver;

    @Bean
    public HibernatePropertiesCustomizer hibernateMultiTenancyCustomizer() {
        return props -> {
            props.put(AvailableSettings.MULTI_TENANT_CONNECTION_PROVIDER, connectionProvider);
            props.put(AvailableSettings.MULTI_TENANT_IDENTIFIER_RESOLVER, identifierResolver);
            props.put("hibernate.multiTenancy", "SCHEMA");
        };
    }
}
