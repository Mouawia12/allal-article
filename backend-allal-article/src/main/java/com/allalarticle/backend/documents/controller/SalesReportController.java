package com.allalarticle.backend.documents.controller;

import com.allalarticle.backend.common.response.ApiResponse;
import com.allalarticle.backend.documents.dto.ProductSalesRow;
import com.allalarticle.backend.documents.dto.SalesReportRow;
import com.allalarticle.backend.documents.service.SalesReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports/sales")
@RequiredArgsConstructor
public class SalesReportController {

    private final SalesReportService service;

    @GetMapping("/by-customer")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'reports.sales')")
    public ResponseEntity<ApiResponse<List<SalesReportRow>>> byCustomer(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(service.salesByCustomer(from, to)));
    }

    @GetMapping("/by-salesperson")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'reports.sales')")
    public ResponseEntity<ApiResponse<List<SalesReportRow>>> bySalesperson(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(service.salesBySalesperson(from, to)));
    }

    @GetMapping("/by-wilaya")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'reports.sales')")
    public ResponseEntity<ApiResponse<List<SalesReportRow>>> byWilaya(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(service.salesByWilaya(from, to)));
    }

    @GetMapping("/by-product")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'reports.sales')")
    public ResponseEntity<ApiResponse<List<ProductSalesRow>>> byProduct(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(service.salesByProduct(from, to)));
    }
}
