package com.allalarticle.backend.roles.dto;

import com.allalarticle.backend.roles.entity.Permission;

public record PermissionResponse(
        Long id,
        String code,
        String module,
        String nameAr,
        String uiRoute,
        String uiActionKey
) {
    public static PermissionResponse from(Permission p) {
        return new PermissionResponse(p.getId(), p.getCode(), p.getModule(),
                p.getNameAr(), p.getUiRoute(), p.getUiActionKey());
    }
}
