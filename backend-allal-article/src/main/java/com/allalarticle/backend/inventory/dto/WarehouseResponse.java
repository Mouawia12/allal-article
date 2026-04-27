package com.allalarticle.backend.inventory.dto;

import com.allalarticle.backend.inventory.entity.Warehouse;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record WarehouseResponse(
        Long id,
        String code,
        String name,
        String warehouseType,
        String city,
        String address,
        Long managerId,
        String managerName,
        BigDecimal capacityQty,
        boolean isDefault,
        boolean active,
        OffsetDateTime createdAt
) {
    public static WarehouseResponse from(Warehouse w) {
        var mgr = w.getManager();
        return new WarehouseResponse(
                w.getId(), w.getCode(), w.getName(), w.getWarehouseType(),
                w.getCity(), w.getAddress(),
                mgr != null ? mgr.getId()   : null,
                mgr != null ? mgr.getName() : null,
                w.getCapacityQty(), w.isDefault(), w.isActive(), w.getCreatedAt()
        );
    }
}
