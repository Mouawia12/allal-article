package com.allalarticle.backend.products.importing.dto;

import java.util.List;

/**
 * Payload sent by the review screen when the user confirms which extracted
 * products to actually create. Each item is the (possibly user-edited)
 * extracted product; the service auto-creates missing categories/units.
 */
public record ProductImportConfirmRequest(
        List<ImportedProductPayload> items
) {}
