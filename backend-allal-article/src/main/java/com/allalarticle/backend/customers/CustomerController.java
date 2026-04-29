package com.allalarticle.backend.customers;

import com.allalarticle.backend.common.response.ApiResponse;
import com.allalarticle.backend.common.response.PageResponse;
import com.allalarticle.backend.customers.dto.CustomerPaymentRequest;
import com.allalarticle.backend.customers.dto.CustomerPaymentResponse;
import com.allalarticle.backend.customers.dto.CustomerRequest;
import com.allalarticle.backend.customers.dto.CustomerResponse;
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
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'customers.view')")
    public ResponseEntity<ApiResponse<PageResponse<CustomerResponse>>> list(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.ok(customerService.list(q, pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'customers.view')")
    public ResponseEntity<ApiResponse<CustomerResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(customerService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("@permChecker.hasPermission(authentication, 'customers.create')")
    public ResponseEntity<ApiResponse<CustomerResponse>> create(@Valid @RequestBody CustomerRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Customer created", customerService.create(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'customers.edit')")
    public ResponseEntity<ApiResponse<CustomerResponse>> update(
            @PathVariable Long id, @Valid @RequestBody CustomerRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(customerService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'customers.delete')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        customerService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ── Payments ──────────────────────────────────────────────────────────────

    @GetMapping("/{id}/payments")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'customers.view')")
    public ResponseEntity<ApiResponse<List<CustomerPaymentResponse>>> listPayments(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(customerService.listPayments(id)));
    }

    @PostMapping("/{id}/payments")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'customers.edit')")
    public ResponseEntity<ApiResponse<CustomerPaymentResponse>> addPayment(
            @PathVariable Long id,
            @Valid @RequestBody CustomerPaymentRequest req,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Payment recorded", customerService.addPayment(id, req, auth)));
    }
}
