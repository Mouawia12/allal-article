package com.allalarticle.backend.products.importing.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.util.List;

/**
 * Editable representation of one product extracted by AI. Persisted in the
 * import job until the user confirms it. Lists of variants/extra units are
 * preserved so the UI can show them in the review step.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ImportedProductPayload(
        String sku,
        String name,
        String category,
        String baseUnit,
        BigDecimal unitsPerPackage,
        String packageUnit,
        BigDecimal currentPriceAmount,
        BigDecimal minStockQty,
        String barcode,
        String description,
        List<ExtraUnit> extraUnits,
        List<Variant> variants
) {
    public record ExtraUnit(
            String unit,
            BigDecimal conversionFactor,
            BigDecimal price,
            String barcode
    ) {}

    public record Variant(
            String sku,
            String label,
            BigDecimal price,
            BigDecimal stock,
            String barcode
    ) {}
}
