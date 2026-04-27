package com.allalarticle.backend.manufacturing.dto;

import com.allalarticle.backend.manufacturing.entity.ManufacturingRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ManufacturingRequestResponse(
        Long id,
        UUID publicId,
        String requestNumber,
        String sourceType,
        Long sourceOrderId,
        Long productId,
        String productName,
        BigDecimal requestedQty,
        BigDecimal approvedQty,
        BigDecimal producedQty,
        BigDecimal receivedQty,
        String status,
        String priority,
        String factoryName,
        String productionLine,
        Long destinationWarehouseId,
        String destinationLabel,
        LocalDate dueDate,
        boolean depositRequired,
        BigDecimal depositAmount,
        BigDecimal depositPaidAmount,
        String depositStatus,
        String notes,
        OffsetDateTime createdAt,
        OffsetDateTime startedAt,
        OffsetDateTime completedAt,
        OffsetDateTime receivedAt,
        List<MaterialResponse> materials
) {
    public record MaterialResponse(Long id, Long materialProductId, String materialName, BigDecimal plannedQty,
                                   BigDecimal reservedQty, BigDecimal consumedQty, BigDecimal wasteQty) {}

    public static ManufacturingRequestResponse from(ManufacturingRequest mr) {
        var materials = mr.getMaterials().stream()
                .map(m -> new MaterialResponse(m.getId(), m.getMaterialProduct().getId(),
                        m.getMaterialProduct().getName(), m.getPlannedQty(),
                        m.getReservedQty(), m.getConsumedQty(), m.getWasteQty()))
                .toList();
        return new ManufacturingRequestResponse(
                mr.getId(), mr.getPublicId(), mr.getRequestNumber(), mr.getSourceType(),
                mr.getSourceOrderId(), mr.getProduct().getId(), mr.getProduct().getName(),
                mr.getRequestedQty(), mr.getApprovedQty(), mr.getProducedQty(), mr.getReceivedQty(),
                mr.getStatus(), mr.getPriority(), mr.getFactoryName(), mr.getProductionLine(),
                mr.getDestinationWarehouse() != null ? mr.getDestinationWarehouse().getId() : null,
                mr.getDestinationLabel(), mr.getDueDate(),
                mr.isDepositRequired(), mr.getDepositAmount(), mr.getDepositPaidAmount(), mr.getDepositStatus(),
                mr.getNotes(), mr.getCreatedAt(), mr.getStartedAt(), mr.getCompletedAt(), mr.getReceivedAt(),
                materials
        );
    }
}
