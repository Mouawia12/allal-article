package com.allalarticle.backend.products.dto;

import com.allalarticle.backend.products.entity.Category;

import java.util.UUID;

public record CategoryResponse(
        Long id,
        UUID publicId,
        String name,
        String slug,
        String description,
        Long parentId,
        String parentName,
        int sortOrder,
        boolean active
) {
    public static CategoryResponse from(Category c) {
        return new CategoryResponse(
                c.getId(), c.getPublicId(), c.getName(), c.getSlug(), c.getDescription(),
                c.getParent() != null ? c.getParent().getId() : null,
                c.getParent() != null ? c.getParent().getName() : null,
                c.getSortOrder(), c.isActive()
        );
    }
}
