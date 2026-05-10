package com.allalarticle.backend.products.importing;

import com.allalarticle.backend.common.response.ApiResponse;
import com.allalarticle.backend.products.importing.dto.ProductImportConfirmRequest;
import com.allalarticle.backend.products.importing.dto.ProductImportJobResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/products/import")
@RequiredArgsConstructor
public class ProductImportController {

    private final ProductImportService service;

    /** Start an AI-driven extraction job from an uploaded file. Returns the job snapshot. */
    @PostMapping(value = "/parse", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@permChecker.hasPermission(authentication, 'products.create')")
    public ResponseEntity<ApiResponse<ProductImportJobResponse>> parse(
            @RequestPart("file") MultipartFile file,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.ok("بدأت معالجة الملف", service.start(file, auth)));
    }

    /** Poll the current status of an import job. */
    @GetMapping("/jobs/{jobId}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'products.create')")
    public ResponseEntity<ApiResponse<ProductImportJobResponse>> get(@PathVariable String jobId) {
        return ResponseEntity.ok(ApiResponse.ok(service.poll(jobId)));
    }

    /** Confirm the (possibly edited) extracted products and bulk-create them. */
    @PostMapping("/jobs/{jobId}/confirm")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'products.create')")
    public ResponseEntity<ApiResponse<ProductImportJobResponse>> confirm(
            @PathVariable String jobId,
            @RequestBody(required = false) ProductImportConfirmRequest request,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("تم حفظ الأصناف", service.confirm(jobId, request, auth)));
    }

    /** Discard a parsed/ready job (frees memory; same as "close" on the dialog). */
    @DeleteMapping("/jobs/{jobId}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'products.create')")
    public ResponseEntity<ApiResponse<Void>> cancel(@PathVariable String jobId) {
        service.cancel(jobId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
