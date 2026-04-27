package com.allalarticle.backend.suppliers.dto;

import com.allalarticle.backend.suppliers.entity.Supplier;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record SupplierResponse(
        Long id, UUID publicId, String name, String legalName,
        String phone, String email, String taxNumber, String commercialRegister,
        Long wilayaId, String wilayaNameAr,
        String address, String category, String status, String paymentTerms,
        BigDecimal openingBalance, String notes, OffsetDateTime createdAt
) {
    public static SupplierResponse from(Supplier s) {
        var w = s.getWilaya();
        return new SupplierResponse(s.getId(), s.getPublicId(), s.getName(), s.getLegalName(),
                s.getPhone(), s.getEmail(), s.getTaxNumber(), s.getCommercialRegister(),
                w != null ? w.getId() : null, w != null ? w.getNameAr() : null,
                s.getAddress(), s.getCategory(), s.getStatus(), s.getPaymentTerms(),
                s.getOpeningBalance(), s.getNotes(), s.getCreatedAt());
    }
}
