package com.allalarticle.backend.roles.dto;

import com.allalarticle.backend.roles.entity.Role;

import java.util.List;

public record RoleResponse(
        Long id,
        String code,
        String nameAr,
        String description,
        boolean system,
        List<PermissionResponse> permissions
) {
    public static RoleResponse from(Role r) {
        return new RoleResponse(r.getId(), r.getCode(), r.getNameAr(), r.getDescription(),
                r.isSystem(),
                r.getPermissions().stream().map(PermissionResponse::from).toList());
    }

    public static RoleResponse summary(Role r) {
        return new RoleResponse(r.getId(), r.getCode(), r.getNameAr(),
                r.getDescription(), r.isSystem(), List.of());
    }
}
