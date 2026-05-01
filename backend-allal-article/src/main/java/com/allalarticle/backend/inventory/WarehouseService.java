package com.allalarticle.backend.inventory;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.inventory.dto.WarehouseRequest;
import com.allalarticle.backend.inventory.dto.WarehouseResponse;
import com.allalarticle.backend.inventory.entity.Warehouse;
import com.allalarticle.backend.users.TenantUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WarehouseService {

    private final WarehouseRepository warehouseRepo;
    private final TenantUserRepository userRepo;

    @Transactional
    public List<WarehouseResponse> listActive() {
        ensureDefaultWarehouse();
        return warehouseRepo.findByActiveTrueOrderByNameAsc()
                .stream().map(WarehouseResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public WarehouseResponse getById(Long id) {
        return warehouseRepo.findById(id)
                .map(WarehouseResponse::from)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Warehouse not found", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public WarehouseResponse create(WarehouseRequest req) {
        if (warehouseRepo.existsByCode(req.code())) {
            throw new AppException(ErrorCode.CONFLICT, "Warehouse code already exists", HttpStatus.CONFLICT);
        }
        if (req.isDefault()) clearDefaultFlag();

        var builder = Warehouse.builder()
                .code(req.code())
                .name(req.name())
                .warehouseType(req.warehouseType() != null ? req.warehouseType() : "operational")
                .city(req.city())
                .address(req.address())
                .capacityQty(req.capacityQty())
                .isDefault(req.isDefault());

        if (req.managerId() != null) {
            builder.manager(userRepo.findById(req.managerId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Manager not found", HttpStatus.NOT_FOUND)));
        }

        return WarehouseResponse.from(warehouseRepo.save(builder.build()));
    }

    @Transactional
    public WarehouseResponse update(Long id, WarehouseRequest req) {
        var wh = warehouseRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Warehouse not found", HttpStatus.NOT_FOUND));

        if (req.isDefault() && !wh.isDefault()) clearDefaultFlag();

        wh.setName(req.name());
        wh.setCity(req.city());
        wh.setAddress(req.address());
        wh.setCapacityQty(req.capacityQty());
        wh.setDefault(req.isDefault());
        if (req.warehouseType() != null) wh.setWarehouseType(req.warehouseType());
        wh.setManager(req.managerId() != null
                ? userRepo.findById(req.managerId()).orElse(null) : null);

        return WarehouseResponse.from(warehouseRepo.save(wh));
    }

    @Transactional
    public void deactivate(Long id) {
        var wh = warehouseRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Warehouse not found", HttpStatus.NOT_FOUND));
        wh.setActive(false);
        warehouseRepo.save(wh);
    }

    @Transactional
    public WarehouseResponse setDefault(Long id) {
        var wh = warehouseRepo.findById(id)
                .filter(Warehouse::isActive)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Warehouse not found", HttpStatus.NOT_FOUND));
        clearDefaultFlag();
        wh.setDefault(true);
        return WarehouseResponse.from(warehouseRepo.save(wh));
    }

    Warehouse ensureDefaultWarehouse() {
        var active = warehouseRepo.findByActiveTrueOrderByNameAsc();
        if (!active.isEmpty()) {
            if (active.stream().noneMatch(Warehouse::isDefault)) {
                active.get(0).setDefault(true);
                return warehouseRepo.save(active.get(0));
            }
            return active.get(0);
        }

        var warehouse = warehouseRepo.findByCode("MAIN")
                .orElseGet(() -> Warehouse.builder()
                        .code("MAIN")
                        .name("المستودع الرئيسي")
                        .warehouseType("central")
                        .city("غير محدد")
                        .capacityQty(new BigDecimal("100000"))
                        .build());
        warehouse.setActive(true);
        warehouse.setDefault(true);
        if (warehouse.getName() == null || warehouse.getName().isBlank()) {
            warehouse.setName("المستودع الرئيسي");
        }
        if (warehouse.getWarehouseType() == null || warehouse.getWarehouseType().isBlank()) {
            warehouse.setWarehouseType("central");
        }
        if (warehouse.getCapacityQty() == null || warehouse.getCapacityQty().compareTo(BigDecimal.ZERO) <= 0) {
            warehouse.setCapacityQty(new BigDecimal("100000"));
        }
        return warehouseRepo.save(warehouse);
    }

    private void clearDefaultFlag() {
        warehouseRepo.findByIsDefaultTrue().ifPresent(w -> {
            w.setDefault(false);
            warehouseRepo.save(w);
        });
    }
}
