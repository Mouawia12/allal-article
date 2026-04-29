package com.allalarticle.backend.customers.dto;

import com.allalarticle.backend.customers.entity.CustomerPayment;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record CustomerPaymentResponse(
        Long id,
        UUID publicId,
        Long customerId,
        BigDecimal amount,
        String direction,
        String paymentMethod,
        String referenceNumber,
        Long receivedById,
        String receivedByName,
        String counterpartyName,
        LocalDate paymentDate,
        String notes,
        OffsetDateTime createdAt
) {
    public static CustomerPaymentResponse from(CustomerPayment p) {
        return new CustomerPaymentResponse(
                p.getId(), p.getPublicId(),
                p.getCustomer().getId(),
                p.getAmount(), p.getDirection(), p.getPaymentMethod(),
                p.getReferenceNumber(),
                p.getReceivedBy() != null ? p.getReceivedBy().getId() : null,
                p.getReceivedBy() != null ? p.getReceivedBy().getName() : null,
                p.getCounterpartyName(),
                p.getPaymentDate(), p.getNotes(), p.getCreatedAt()
        );
    }
}
