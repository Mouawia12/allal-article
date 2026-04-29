package com.allalarticle.backend.customers;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.common.response.PageResponse;
import com.allalarticle.backend.customers.dto.CustomerPaymentRequest;
import com.allalarticle.backend.customers.dto.CustomerPaymentResponse;
import com.allalarticle.backend.customers.dto.CustomerRequest;
import com.allalarticle.backend.customers.dto.CustomerResponse;
import com.allalarticle.backend.customers.entity.Customer;
import com.allalarticle.backend.customers.entity.CustomerPayment;
import com.allalarticle.backend.orders.OrderRepository;
import com.allalarticle.backend.reference.WilayaRepository;
import com.allalarticle.backend.users.TenantUserRepository;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository        customerRepo;
    private final CustomerPaymentRepository paymentRepo;
    private final OrderRepository           orderRepo;
    private final WilayaRepository          wilayaRepo;
    private final TenantUserRepository      userRepo;

    // ── Customers ─────────────────────────────────────────────────────────────

    private CustomerResponse toResponse(Customer c) {
        return CustomerResponse.from(c,
                orderRepo.sumTotalByCustomerId(c.getId()),
                paymentRepo.sumNetByCustomerId(c.getId()));
    }

    @Transactional(readOnly = true)
    public PageResponse<CustomerResponse> list(String q, Pageable pageable) {
        var page = (q != null && !q.isBlank())
                ? customerRepo.search(q.trim(), pageable)
                : customerRepo.findByDeletedAtIsNull(pageable);
        return PageResponse.from(page.map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public CustomerResponse getById(Long id) {
        return customerRepo.findById(id)
                .filter(c -> c.getDeletedAt() == null)
                .map(this::toResponse)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Customer not found", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public CustomerResponse create(CustomerRequest req) {
        var builder = Customer.builder()
                .name(req.name())
                .phone(req.phone())
                .phone2(req.phone2())
                .email(req.email())
                .address(req.address())
                .shippingRoute(req.shippingRoute())
                .notes(req.notes());

        if (req.openingBalance() != null) builder.openingBalance(req.openingBalance());
        if (req.wilayaId()       != null) builder.wilaya(wilayaRepo.findById(req.wilayaId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Wilaya not found", HttpStatus.NOT_FOUND)));
        if (req.salespersonId()  != null) builder.salesperson(userRepo.findById(req.salespersonId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "User not found", HttpStatus.NOT_FOUND)));

        return toResponse(customerRepo.save(builder.build()));
    }

    @Transactional
    public CustomerResponse update(Long id, CustomerRequest req) {
        var c = customerRepo.findById(id)
                .filter(x -> x.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Customer not found", HttpStatus.NOT_FOUND));

        c.setName(req.name());
        c.setPhone(req.phone());
        c.setPhone2(req.phone2());
        c.setEmail(req.email());
        c.setAddress(req.address());
        c.setShippingRoute(req.shippingRoute());
        c.setNotes(req.notes());
        if (req.openingBalance() != null) c.setOpeningBalance(req.openingBalance());
        c.setWilaya(req.wilayaId() != null
                ? wilayaRepo.findById(req.wilayaId()).orElse(null) : null);
        c.setSalesperson(req.salespersonId() != null
                ? userRepo.findById(req.salespersonId()).orElse(null) : null);

        return toResponse(customerRepo.save(c));
    }

    @Transactional
    public void delete(Long id) {
        var c = customerRepo.findById(id)
                .filter(x -> x.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Customer not found", HttpStatus.NOT_FOUND));
        c.setDeletedAt(OffsetDateTime.now());
        customerRepo.save(c);
    }

    // ── Payments ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CustomerPaymentResponse> listPayments(Long customerId) {
        customerRepo.findById(customerId)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Customer not found", HttpStatus.NOT_FOUND));
        return paymentRepo.findByCustomerIdOrderByPaymentDateDescCreatedAtDesc(customerId)
                .stream().map(CustomerPaymentResponse::from).toList();
    }

    @Transactional
    public CustomerPaymentResponse addPayment(Long customerId, CustomerPaymentRequest req, Authentication auth) {
        var customer = customerRepo.findById(customerId)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Customer not found", HttpStatus.NOT_FOUND));

        Long userId = null;
        if (auth instanceof UsernamePasswordAuthenticationToken t && t.getDetails() instanceof Claims claims) {
            userId = claims.get("userId", Long.class);
        }

        var receivedBy = (req.receivedById() != null)
                ? userRepo.findById(req.receivedById())
                        .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "User not found", HttpStatus.NOT_FOUND))
                : null;

        var payment = CustomerPayment.builder()
                .customer(customer)
                .amount(req.amount())
                .direction(req.direction())
                .paymentMethod(req.paymentMethod())
                .referenceNumber(req.referenceNumber())
                .receivedBy(receivedBy)
                .counterpartyName(req.counterpartyName())
                .paymentDate(req.paymentDate() != null ? req.paymentDate() : LocalDate.now())
                .notes(req.notes())
                .createdBy(userId)
                .build();

        return CustomerPaymentResponse.from(paymentRepo.save(payment));
    }
}
