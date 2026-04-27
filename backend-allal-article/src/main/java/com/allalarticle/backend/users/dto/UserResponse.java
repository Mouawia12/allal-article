package com.allalarticle.backend.users.dto;

import com.allalarticle.backend.users.entity.TenantUser;

import java.time.OffsetDateTime;
import java.util.UUID;

public record UserResponse(
        Long id,
        UUID publicId,
        String name,
        String email,
        String phone,
        String userType,
        String status,
        Long roleId,
        String roleCode,
        String roleNameAr,
        OffsetDateTime createdAt
) {
    public static UserResponse from(TenantUser u) {
        var role = u.getPrimaryRole();
        return new UserResponse(
                u.getId(), u.getPublicId(), u.getName(), u.getEmail(), u.getPhone(),
                u.getUserType(), u.getStatus(),
                role != null ? role.getId() : null,
                role != null ? role.getCode() : null,
                role != null ? role.getNameAr() : null,
                u.getCreatedAt()
        );
    }
}
