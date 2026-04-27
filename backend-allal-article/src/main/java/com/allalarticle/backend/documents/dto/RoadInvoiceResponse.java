package com.allalarticle.backend.documents.dto;

import com.allalarticle.backend.documents.entity.RoadInvoice;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public record RoadInvoiceResponse(
        Long id,
        UUID publicId,
        String invoiceNumber,
        LocalDate invoiceDate,
        Long wilayaId,
        String wilayaName,
        Long customerId,
        String customerName,
        Long driverId,
        String status,
        BigDecimal totalWeight,
        String notes,
        int printCount,
        OffsetDateTime lastPrintedAt,
        OffsetDateTime whatsappSentAt,
        OffsetDateTime createdAt,
        List<ItemResponse> items,
        Set<Long> linkedOrderIds
) {
    public record ItemResponse(Long id, Long productId, String productName, BigDecimal quantity, BigDecimal unitPrice, BigDecimal lineWeight, String notes) {}

    public static RoadInvoiceResponse from(RoadInvoice ri) {
        var items = ri.getItems().stream()
                .map(i -> new ItemResponse(i.getId(), i.getProduct().getId(), i.getProduct().getName(),
                        i.getQuantity(), i.getUnitPrice(), i.getLineWeight(), i.getNotes()))
                .toList();
        var orderIds = ri.getLinkedOrders().stream().map(o -> o.getId()).collect(java.util.stream.Collectors.toSet());
        return new RoadInvoiceResponse(
                ri.getId(), ri.getPublicId(), ri.getInvoiceNumber(), ri.getInvoiceDate(),
                ri.getWilaya() != null ? ri.getWilaya().getId() : null,
                ri.getWilaya() != null ? ri.getWilaya().getNameAr() : null,
                ri.getCustomer() != null ? ri.getCustomer().getId() : null,
                ri.getCustomer() != null ? ri.getCustomer().getName() : null,
                ri.getDriverId(), ri.getStatus(), ri.getTotalWeight(), ri.getNotes(),
                ri.getPrintCount(), ri.getLastPrintedAt(), ri.getWhatsappSentAt(), ri.getCreatedAt(),
                items, orderIds
        );
    }
}
