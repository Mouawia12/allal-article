package com.allalarticle.backend.tenant;

/**
 * ThreadLocal holder for the current tenant's schema name.
 * Set by JwtAuthFilter on each request; cleared after the request completes.
 */
public final class TenantContext {

    private static final ThreadLocal<String> CURRENT_SCHEMA = new ThreadLocal<>();

    private TenantContext() {}

    public static void set(String schema) {
        CURRENT_SCHEMA.set(schema);
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
