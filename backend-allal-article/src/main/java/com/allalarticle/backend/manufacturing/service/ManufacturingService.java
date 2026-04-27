package com.allalarticle.backend.manufacturing.service;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.inventory.ProductStockRepository;
import com.allalarticle.backend.inventory.StockMovementRepository;
import com.allalarticle.backend.inventory.WarehouseRepository;
import com.allalarticle.backend.inventory.entity.ProductStock;
import com.allalarticle.backend.inventory.entity.StockMovement;
import com.allalarticle.backend.inventory.entity.Warehouse;
import com.allalarticle.backend.manufacturing.dto.*;
import com.allalarticle.backend.manufacturing.entity.*;
import com.allalarticle.backend.manufacturing.repository.*;
import com.allalarticle.backend.products.ProductRepository;
import com.allalarticle.backend.products.entity.Product;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ManufacturingService {

    private final ManufacturingRequestRepository requestRepo;
    private final ManufacturingMaterialRepository materialRepo;
    private final ManufacturingQualityCheckRepository qcRepo;
    private final ManufacturingEventRepository eventRepo;
    private final ManufacturingReceiptRepository receiptRepo;
    private final ProductRepository productRepo;
    private final WarehouseRepository warehouseRepo;
    private final ProductStockRepository stockRepo;
    private final StockMovementRepository movementRepo;

    @Transactional(readOnly = true)
    public Page<ManufacturingRequestResponse> list(String status, Pageable pageable) {
        if (status != null) return requestRepo.findByStatus(status, pageable).map(ManufacturingRequestResponse::from);
        return requestRepo.findAll(pageable).map(ManufacturingRequestResponse::from);
    }

    @Transactional(readOnly = true)
    public ManufacturingRequestResponse findById(Long id) {
        return ManufacturingRequestResponse.from(getOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<ManufacturingEvent> getEvents(Long id) {
        getOrThrow(id);
        return eventRepo.findByRequestIdOrderByCreatedAtAsc(id);
    }

    @Transactional(readOnly = true)
    public List<ManufacturingQualityCheck> getQualityChecks(Long id) {
        return qcRepo.findByRequestIdOrderByCheckedAtDesc(id);
    }

    @Transactional
    public ManufacturingRequestResponse create(ManufacturingRequestRequest req, Long userId) {
        Product product = productRepo.findById(req.productId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "المنتج غير موجود", HttpStatus.NOT_FOUND));

        Warehouse warehouse = req.destinationWarehouseId() != null
                ? warehouseRepo.findById(req.destinationWarehouseId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "المستودع غير موجود", HttpStatus.NOT_FOUND))
                : null;

        ManufacturingRequest mr = ManufacturingRequest.builder()
                .requestNumber("TEMP")
                .sourceType(req.sourceType())
                .sourceOrderId(req.sourceOrderId())
                .sourceOrderItemId(req.sourceOrderItemId())
                .product(product)
                .requestedQty(req.requestedQty())
                .unitName(req.unitName())
                .priority(req.priority() != null ? req.priority() : "normal")
                .factoryName(req.factoryName())
                .productionLine(req.productionLine())
                .responsibleUserId(req.responsibleUserId())
                .qualityUserId(req.qualityUserId())
                .destinationWarehouse(warehouse)
                .destinationLabel(req.destinationLabel())
                .linkedCustomerId(req.linkedCustomerId())
                .customerSnapshot(req.customerSnapshot())
                .depositRequired(req.depositRequired())
                .depositAmount(req.depositAmount() != null ? req.depositAmount() : BigDecimal.ZERO)
                .dueDate(req.dueDate())
                .notes(req.notes())
                .requestedById(userId)
                .build();

        if (req.materials() != null) {
            List<ManufacturingMaterial> materials = buildMaterials(mr, req.materials());
            mr.getMaterials().addAll(materials);
        }

        ManufacturingRequest saved = requestRepo.save(mr);
        saved.setRequestNumber("MR-" + Year.now() + "-" + String.format("%06d", saved.getId()));
        recordEvent(saved, "CREATED", null, "draft", userId, null);
        return ManufacturingRequestResponse.from(requestRepo.save(saved));
    }

    @Transactional
    public ManufacturingRequestResponse approve(Long id, ApproveRequest req, Long userId) {
        ManufacturingRequest mr = getOrThrow(id);
        requireStatus(mr, "draft");

        mr.setApprovedQty(req.approvedQty());
        mr.setApprovedById(userId);
        mr.setStatus("approved");

        // Reserve materials from stock
        for (ManufacturingMaterial mat : mr.getMaterials()) {
            Warehouse wh = mat.getWarehouse() != null ? mat.getWarehouse()
                    : warehouseRepo.findByIsDefaultTrue()
                        .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "لا يوجد مستودع افتراضي", HttpStatus.NOT_FOUND));
            ProductStock stock = stockRepo.findForUpdate(mat.getMaterialProduct().getId(), wh.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.BAD_REQUEST,
                            "لا يوجد مخزون كافٍ للمادة: " + mat.getMaterialProduct().getName(), HttpStatus.BAD_REQUEST));

            if (stock.getAvailableQty().compareTo(mat.getPlannedQty()) < 0) {
                throw new AppException(ErrorCode.BAD_REQUEST,
                        "المخزون المتاح غير كافٍ للمادة: " + mat.getMaterialProduct().getName(), HttpStatus.BAD_REQUEST);
            }
            stock.setReservedQty(stock.getReservedQty().add(mat.getPlannedQty()));
            stock.setAvailableQty(stock.getAvailableQty().subtract(mat.getPlannedQty()));
            stockRepo.save(stock);
            mat.setReservedQty(mat.getPlannedQty());
        }

        recordEvent(mr, "APPROVED", "draft", "approved", userId, Map.of("approvedQty", req.approvedQty()));
        return ManufacturingRequestResponse.from(requestRepo.save(mr));
    }

    @Transactional
    public ManufacturingRequestResponse startProduction(Long id, Long userId) {
        ManufacturingRequest mr = getOrThrow(id);
        requireStatus(mr, "approved");
        mr.setStatus("in_production");
        mr.setStartedAt(OffsetDateTime.now());
        recordEvent(mr, "PRODUCTION_STARTED", "approved", "in_production", userId, null);
        return ManufacturingRequestResponse.from(requestRepo.save(mr));
    }

    @Transactional
    public ManufacturingRequestResponse submitQualityCheck(Long id, QualityCheckRequest req, Long userId) {
        ManufacturingRequest mr = getOrThrow(id);
        requireStatus(mr, "in_production");

        ManufacturingQualityCheck qc = ManufacturingQualityCheck.builder()
                .request(mr)
                .checkedById(userId)
                .result(req.result())
                .checkedQty(req.checkedQty())
                .passedQty(req.passedQty())
                .reworkQty(req.reworkQty() != null ? req.reworkQty() : BigDecimal.ZERO)
                .rejectedQty(req.rejectedQty() != null ? req.rejectedQty() : BigDecimal.ZERO)
                .notes(req.notes())
                .build();
        qcRepo.save(qc);

        mr.setStatus("quality_check");
        mr.setProducedQty(req.checkedQty());
        recordEvent(mr, "QUALITY_CHECK", "in_production", "quality_check", userId,
                Map.of("result", req.result(), "passedQty", req.passedQty()));
        return ManufacturingRequestResponse.from(requestRepo.save(mr));
    }

    @Transactional
    public ManufacturingRequestResponse markReadyToShip(Long id, Long userId) {
        ManufacturingRequest mr = getOrThrow(id);
        requireStatus(mr, "quality_check");
        mr.setStatus("ready_to_ship");
        mr.setCompletedAt(OffsetDateTime.now());
        recordEvent(mr, "READY_TO_SHIP", "quality_check", "ready_to_ship", userId, null);
        return ManufacturingRequestResponse.from(requestRepo.save(mr));
    }

    @Transactional
    public ManufacturingRequestResponse ship(Long id, Long userId) {
        ManufacturingRequest mr = getOrThrow(id);
        requireStatus(mr, "ready_to_ship");
        mr.setStatus("in_transit");
        mr.setShippedAt(OffsetDateTime.now());
        recordEvent(mr, "SHIPPED", "ready_to_ship", "in_transit", userId, null);
        return ManufacturingRequestResponse.from(requestRepo.save(mr));
    }

    @Transactional
    public ManufacturingRequestResponse receive(Long id, ReceiveManufacturingRequest req, Long userId) {
        ManufacturingRequest mr = getOrThrow(id);
        requireStatus(mr, "in_transit");

        Warehouse warehouse = warehouseRepo.findById(req.warehouseId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "المستودع غير موجود", HttpStatus.NOT_FOUND));

        // Add finished product to stock
        ProductStock stock = stockRepo.findForUpdate(mr.getProduct().getId(), warehouse.getId())
                .orElseGet(() -> ProductStock.builder().product(mr.getProduct()).warehouse(warehouse).build());
        BigDecimal before = stock.getOnHandQty();
        BigDecimal after = before.add(req.receivedQty());
        stock.setOnHandQty(after);
        stock.setAvailableQty(after.subtract(stock.getReservedQty()));
        stock.setLastRecomputedAt(OffsetDateTime.now());
        stockRepo.save(stock);

        StockMovement movement = movementRepo.save(StockMovement.builder()
                .product(mr.getProduct())
                .warehouse(warehouse)
                .movementType("PURCHASE_IN")
                .qty(req.receivedQty())
                .balanceBefore(before)
                .balanceAfter(after)
                .sourceType("manufacturing_request")
                .sourceId(mr.getId())
                .build());

        // Consume reserved materials from stock
        for (ManufacturingMaterial mat : mr.getMaterials()) {
            Warehouse matWh = mat.getWarehouse() != null ? mat.getWarehouse()
                    : warehouseRepo.findByIsDefaultTrue().orElse(warehouse);
            ProductStock matStock = stockRepo.findForUpdate(mat.getMaterialProduct().getId(), matWh.getId())
                    .orElse(null);
            if (matStock != null && mat.getReservedQty().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal mb = matStock.getOnHandQty();
                BigDecimal ma = mb.subtract(mat.getReservedQty());
                matStock.setOnHandQty(ma.max(BigDecimal.ZERO));
                matStock.setReservedQty(matStock.getReservedQty().subtract(mat.getReservedQty()).max(BigDecimal.ZERO));
                matStock.setLastRecomputedAt(OffsetDateTime.now());
                stockRepo.save(matStock);

                movementRepo.save(StockMovement.builder()
                        .product(mat.getMaterialProduct())
                        .warehouse(matWh)
                        .movementType("ADJUSTMENT_OUT")
                        .qty(mat.getReservedQty())
                        .balanceBefore(mb)
                        .balanceAfter(matStock.getOnHandQty())
                        .sourceType("manufacturing_request")
                        .sourceId(mr.getId())
                        .build());
                mat.setConsumedQty(mat.getReservedQty());
                mat.setReservedQty(BigDecimal.ZERO);
            }
        }

        receiptRepo.save(ManufacturingReceipt.builder()
                .request(mr)
                .warehouse(warehouse)
                .receivedQty(req.receivedQty())
                .acceptedQty(req.acceptedQty() != null ? req.acceptedQty() : req.receivedQty())
                .quarantineQty(req.quarantineQty() != null ? req.quarantineQty() : BigDecimal.ZERO)
                .stockMovementId(movement.getId())
                .receivedById(userId)
                .notes(req.notes())
                .build());

        mr.setReceivedQty(req.receivedQty());
        mr.setStatus("received");
        mr.setReceivedAt(OffsetDateTime.now());
        recordEvent(mr, "RECEIVED", "in_transit", "received", userId, Map.of("receivedQty", req.receivedQty()));
        return ManufacturingRequestResponse.from(requestRepo.save(mr));
    }

    @Transactional
    public ManufacturingRequestResponse cancel(Long id, String reason, Long userId) {
        ManufacturingRequest mr = getOrThrow(id);
        if ("received".equals(mr.getStatus()) || "cancelled".equals(mr.getStatus())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "لا يمكن إلغاء هذا الطلب", HttpStatus.BAD_REQUEST);
        }
        String oldStatus = mr.getStatus();

        // Release reserved materials
        if ("approved".equals(oldStatus) || "in_production".equals(oldStatus) || "quality_check".equals(oldStatus)) {
            for (ManufacturingMaterial mat : mr.getMaterials()) {
                if (mat.getReservedQty().compareTo(BigDecimal.ZERO) > 0) {
                    Warehouse matWh = mat.getWarehouse() != null ? mat.getWarehouse()
                            : warehouseRepo.findByIsDefaultTrue().orElse(null);
                    if (matWh != null) {
                        stockRepo.findForUpdate(mat.getMaterialProduct().getId(), matWh.getId())
                                .ifPresent(s -> {
                                    s.setReservedQty(s.getReservedQty().subtract(mat.getReservedQty()).max(BigDecimal.ZERO));
                                    s.setAvailableQty(s.getAvailableQty().add(mat.getReservedQty()));
                                    stockRepo.save(s);
                                    mat.setReservedQty(BigDecimal.ZERO);
                                });
                    }
                }
            }
        }

        mr.setStatus("cancelled");
        mr.setCancelledAt(OffsetDateTime.now());
        mr.setCancelReason(reason);
        recordEvent(mr, "CANCELLED", oldStatus, "cancelled", userId, reason != null ? Map.of("reason", reason) : null);
        return ManufacturingRequestResponse.from(requestRepo.save(mr));
    }

    private void requireStatus(ManufacturingRequest mr, String expected) {
        if (!expected.equals(mr.getStatus())) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "الحالة المطلوبة: " + expected + "، الحالة الحالية: " + mr.getStatus(), HttpStatus.BAD_REQUEST);
        }
    }

    private void recordEvent(ManufacturingRequest mr, String type, String oldStatus, String newStatus,
                              Long userId, Map<String, Object> payload) {
        eventRepo.save(ManufacturingEvent.builder()
                .request(mr)
                .eventType(type)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .performedById(userId)
                .payloadJson(payload)
                .build());
    }

    private List<ManufacturingMaterial> buildMaterials(ManufacturingRequest mr,
                                                         List<ManufacturingRequestRequest.MaterialLine> lines) {
        List<ManufacturingMaterial> result = new ArrayList<>();
        for (var line : lines) {
            Product mat = productRepo.findById(line.materialProductId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "المنتج غير موجود: " + line.materialProductId(), HttpStatus.NOT_FOUND));
            Warehouse wh = line.warehouseId() != null
                    ? warehouseRepo.findById(line.warehouseId()).orElse(null) : null;
            result.add(ManufacturingMaterial.builder()
                    .request(mr)
                    .materialProduct(mat)
                    .plannedQty(line.plannedQty())
                    .warehouse(wh)
                    .notes(line.notes())
                    .build());
        }
        return result;
    }

    ManufacturingRequest getOrThrow(Long id) {
        return requestRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "طلب التصنيع غير موجود", HttpStatus.NOT_FOUND));
    }
}
