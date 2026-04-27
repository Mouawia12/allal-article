package com.allalarticle.backend.inventory;

import com.allalarticle.backend.common.response.ApiResponse;
import com.allalarticle.backend.inventory.dto.WarehouseRequest;
import com.allalarticle.backend.inventory.dto.WarehouseResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory/warehouses")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseService warehouseService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WarehouseResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(warehouseService.listActive()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WarehouseResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(warehouseService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'inventory.warehouses.create')")
    public ResponseEntity<ApiResponse<WarehouseResponse>> create(@Valid @RequestBody WarehouseRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Warehouse created", warehouseService.create(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'inventory.warehouses.update')")
    public ResponseEntity<ApiResponse<WarehouseResponse>> update(
            @PathVariable Long id, @Valid @RequestBody WarehouseRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(warehouseService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'inventory.warehouses.delete')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        warehouseService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
