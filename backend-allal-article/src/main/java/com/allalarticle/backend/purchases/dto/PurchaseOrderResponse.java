package com.allalarticle.backend.purchases.dto;

import com.allalarticle.backend.purchases.entity.PurchaseOrder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record PurchaseOrderResponse(
        Long id, UUID publicId, String poNumber,
        Long supplierId, String supplierName,
        String status, String paymentStatus, String priceCurrency,
        UUID linkedPartnerUuid, UUID partnerDocumentLinkPublicId,
        UUID partnerSourceDocumentPublicId, String partnerSyncStatus,
        LocalDate expectedDate, LocalDate receivedDate,
        BigDecimal totalAmount, String notes,
        List<PurchaseItemResponse> items,
        OffsetDateTime createdAt
) {
    public static PurchaseOrderResponse from(PurchaseOrder po) {
        var s = po.getSupplier();
        return new PurchaseOrderResponse(po.getId(), po.getPublicId(), po.getPoNumber(),
                s != null ? s.getId() : null, po.getSupplierName(),
                po.getStatus(), po.getPaymentStatus(), po.getPriceCurrency(),
                po.getLinkedPartnerUuid(), po.getPartnerDocumentLinkPublicId(),
                po.getPartnerSourceDocumentPublicId(), po.getPartnerSyncStatus(),
                po.getExpectedDate(), po.getReceivedDate(),
                po.getTotalAmount(), po.getNotes(),
                po.getItems().stream().map(PurchaseItemResponse::from).toList(),
                po.getCreatedAt());
    }
}
