package com.allalarticle.backend.tenant;

import java.util.regex.Pattern;

/**
 * ThreadLocal holder for the current tenant's schema name.
 * Set by JwtAuthFilter on each request; cleared after the request completes.
 */
public final class TenantContext {

    private static final ThreadLocal<String> CURRENT_SCHEMA = new ThreadLocal<>();
    private static final Pattern TENANT_SCHEMA_PATTERN = Pattern.compile("^tenant_[0-9a-f]{12}$");

    private TenantContext() {}

    public static void set(String schema) {
        requireValidSchema(schema);
        CURRENT_SCHEMA.set(schema);
    }

    public static boolean isValidSchema(String schema) {
        return schema != null && TENANT_SCHEMA_PATTERN.matcher(schema).matches();
    }

    public static void requireValidSchema(String schema) {
        if (!isValidSchema(schema)) {
            throw new IllegalArgumentException("Invalid tenant schema");
        }
    }

    public static String get() {
        return CURRENT_SCHEMA.get();
    }

    public static boolean isSet() {
        String s = CURRENT_SCHEMA.get();
        return s != null && !s.isBlank();
    }

    public static void clear() {
        CURRENT_SCHEMA.remove();
    }
}
