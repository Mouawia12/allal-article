package com.allalarticle.backend.partnerships;

import java.util.Map;
import java.util.UUID;

public record ResolvedPartnerSupplierLink(
        Long partnershipId,
        Long providerTenantId,
        UUID providerUuid,
        String providerSchema,
        String providerName,
        String providerEmail,
        Long requesterTenantId,
        UUID requesterUuid,
        String requesterName,
        String requesterEmail,
        String requesterPhone,
        Map<String, Object> permissions,
        String matchMethod
) {
    public boolean hasPermission(String permission) {
        return Boolean.TRUE.equals(permissions.get(permission));
    }
}
