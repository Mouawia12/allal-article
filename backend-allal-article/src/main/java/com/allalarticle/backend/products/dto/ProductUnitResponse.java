package com.allalarticle.backend.products.dto;

import com.allalarticle.backend.products.entity.ProductUnit;

public record ProductUnitResponse(Long id, String name, String symbol, boolean system) {
    public static ProductUnitResponse from(ProductUnit u) {
        return new ProductUnitResponse(u.getId(), u.getName(), u.getSymbol(), u.isSystem());
    }
}
