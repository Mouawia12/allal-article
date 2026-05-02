package com.allalarticle.backend.products;

import com.allalarticle.backend.common.response.ApiResponse;
import com.allalarticle.backend.common.response.PageResponse;
import com.allalarticle.backend.products.dto.ProductPriceHistoryResponse;
import com.allalarticle.backend.products.dto.ProductImageGenerationRequest;
import com.allalarticle.backend.products.dto.ProductImageGenerationResponse;
import com.allalarticle.backend.products.dto.ProductImageResponse;
import com.allalarticle.backend.products.dto.ProductRequest;
import com.allalarticle.backend.products.dto.ProductResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final ProductImageGenerationService productImageGenerationService;
    private final ProductImageService productImageService;

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

    @PostMapping("/{id}/images/generate")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'products.edit')")
    public ResponseEntity<ApiResponse<ProductImageGenerationResponse>> generateImage(
            @PathVariable Long id,
            @RequestBody(required = false) ProductImageGenerationRequest request,
            Authentication auth) {
        ProductImageGenerationRequest safeRequest = request != null
                ? request
                : new ProductImageGenerationRequest(null, null, null, null, null, null, null);
        return ResponseEntity.ok(ApiResponse.ok(
                "تم توليد صورة الصنف",
                productImageGenerationService.generate(id, safeRequest, auth)));
    }

    @GetMapping("/{id}/images")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'products.view')")
    public ResponseEntity<ApiResponse<List<ProductImageResponse>>> listImages(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(productImageService.list(id)));
    }

    @PostMapping(value = "/{id}/images/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@permChecker.hasPermission(authentication, 'products.edit')")
    public ResponseEntity<ApiResponse<ProductImageResponse>> uploadImage(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("تم رفع صورة الصنف", productImageService.upload(id, file, auth)));
    }

    @PostMapping("/{id}/images/{imageId}/process")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'products.edit')")
    public ResponseEntity<ApiResponse<ProductImageResponse>> processImage(
            @PathVariable Long id,
            @PathVariable Long imageId,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("تمت معالجة صورة الصنف", productImageService.process(id, imageId, auth)));
    }

    @PatchMapping("/{id}/images/{imageId}/primary")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'products.edit')")
    public ResponseEntity<ApiResponse<ProductImageResponse>> setPrimaryImage(
            @PathVariable Long id,
            @PathVariable Long imageId) {
        return ResponseEntity.ok(ApiResponse.ok("تم تعيين الصورة الرئيسية", productImageService.setPrimary(id, imageId)));
    }

    @DeleteMapping("/{id}/images/{imageId}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'products.edit')")
    public ResponseEntity<ApiResponse<Void>> deleteImage(
            @PathVariable Long id,
            @PathVariable Long imageId) {
        productImageService.delete(id, imageId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'products.create')")
    public ResponseEntity<ApiResponse<ProductResponse>> create(
            @Valid @RequestBody ProductRequest req,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Product created", productService.create(req, auth)));
    }

    @PostMapping("/bulk")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'products.create')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> bulkCreate(
            @RequestBody List<ProductRequest> requests,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Bulk import processed", productService.bulkCreate(requests, auth)));
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
