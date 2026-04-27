package com.allalarticle.backend.products.dto;

import com.allalarticle.backend.products.entity.Product;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ProductResponse(
        Long id,
        UUID publicId,
        String sku,
        String name,
        Long categoryId,
        String categoryName,
        Long baseUnitId,
        String baseUnitName,
        String baseUnitSymbol,
        String barcode,
        boolean hasVariants,
        BigDecimal unitsPerPackage,
        BigDecimal currentPriceAmount,
        String priceCurrency,
        BigDecimal minStockQty,
        String description,
        String status,
        OffsetDateTime createdAt
) {
    public static ProductResponse from(Product p) {
        var cat  = p.getCategory();
        var unit = p.getBaseUnit();
        return new ProductResponse(
                p.getId(), p.getPublicId(), p.getSku(), p.getName(),
                cat  != null ? cat.getId()    : null,
                cat  != null ? cat.getName()  : null,
                unit != null ? unit.getId()   : null,
                unit != null ? unit.getName() : null,
                unit != null ? unit.getSymbol(): null,
                p.getBarcode(), p.isHasVariants(), p.getUnitsPerPackage(),
                p.getCurrentPriceAmount(), p.getPriceCurrency(),
                p.getMinStockQty(), p.getDescription(), p.getStatus(), p.getCreatedAt()
        );
    }
}
