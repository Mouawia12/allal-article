package com.allalarticle.backend.products;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.common.response.ApiResponse;
import com.allalarticle.backend.products.dto.ProductUnitRequest;
import com.allalarticle.backend.products.dto.ProductUnitResponse;
import com.allalarticle.backend.products.entity.ProductUnit;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/product-units")
@RequiredArgsConstructor
public class ProductUnitController {

    private final ProductUnitRepository unitRepo;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductUnitResponse>>> list() {
        var result = unitRepo.findAllByOrderByNameAsc().stream()
                .map(ProductUnitResponse::from).toList();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'products.create')")
    public ResponseEntity<ApiResponse<ProductUnitResponse>> create(@Valid @RequestBody ProductUnitRequest req) {
        var unit = ProductUnit.builder().name(req.name()).symbol(req.symbol()).build();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(ProductUnitResponse.from(unitRepo.save(unit))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'products.create')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        var unit = unitRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Unit not found", HttpStatus.NOT_FOUND));
        if (unit.isSystem()) {
            throw new AppException(ErrorCode.FORBIDDEN, "Cannot delete system unit", HttpStatus.FORBIDDEN);
        }
        unitRepo.delete(unit);
        return ResponseEntity.noContent().build();
    }
}
