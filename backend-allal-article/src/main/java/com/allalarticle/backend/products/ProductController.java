package com.allalarticle.backend.products;

import com.allalarticle.backend.common.response.ApiResponse;
import com.allalarticle.backend.common.response.PageResponse;
import com.allalarticle.backend.products.dto.ProductPriceHistoryResponse;
import com.allalarticle.backend.products.dto.ProductRequest;
import com.allalarticle.backend.products.dto.ProductResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(productService.list(q, categoryId, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getById(id)));
    }

    @GetMapping("/{id}/price-history")
    public ResponseEntity<ApiResponse<List<ProductPriceHistoryResponse>>> priceHistory(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getPriceHistory(id)));
    }

    @PostMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'products.create')")
    public ResponseEntity<ApiResponse<ProductResponse>> create(
            @Valid @RequestBody ProductRequest req,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Product created", productService.create(req, auth)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'products.edit')")
    public ResponseEntity<ApiResponse<ProductResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest req,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(productService.update(id, req, auth)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'products.delete')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
