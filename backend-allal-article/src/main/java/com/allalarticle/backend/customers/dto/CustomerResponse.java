package com.allalarticle.backend.customers.dto;

import com.allalarticle.backend.customers.entity.Customer;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record CustomerResponse(
        Long id,
        UUID publicId,
        String name,
        String phone,
        String phone2,
        String email,
        Long wilayaId,
        String wilayaNameAr,
        String address,
        String shippingRoute,
        BigDecimal openingBalance,
        Long salespersonId,
        String salespersonName,
        String status,
        String notes,
        OffsetDateTime createdAt,
        BigDecimal totalAmount,
        BigDecimal paidAmount
) {
    public static CustomerResponse from(Customer c, BigDecimal totalAmount, BigDecimal paidAmount) {
        var wilaya = c.getWilaya();
        var sales  = c.getSalesperson();
        return new CustomerResponse(
                c.getId(), c.getPublicId(), c.getName(), c.getPhone(), c.getPhone2(),
                c.getEmail(),
                wilaya != null ? wilaya.getId()    : null,
                wilaya != null ? wilaya.getNameAr(): null,
                c.getAddress(), c.getShippingRoute(), c.getOpeningBalance(),
                sales != null ? sales.getId()   : null,
                sales != null ? sales.getName() : null,
                c.getStatus(), c.getNotes(), c.getCreatedAt(),
                totalAmount != null ? totalAmount : BigDecimal.ZERO,
                paidAmount  != null ? paidAmount  : BigDecimal.ZERO
        );
    }

    public static CustomerResponse from(Customer c) {
        return from(c, BigDecimal.ZERO, BigDecimal.ZERO);
    }
}
