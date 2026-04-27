package com.allalarticle.backend.suppliers;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.common.response.PageResponse;
import com.allalarticle.backend.reference.WilayaRepository;
import com.allalarticle.backend.suppliers.dto.SupplierRequest;
import com.allalarticle.backend.suppliers.dto.SupplierResponse;
import com.allalarticle.backend.suppliers.entity.Supplier;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepo;
    private final WilayaRepository wilayaRepo;

    @Transactional(readOnly = true)
    public PageResponse<SupplierResponse> list(String q, Pageable pageable) {
        var page = (q != null && !q.isBlank())
                ? supplierRepo.search(q.trim(), pageable)
                : supplierRepo.findAll(pageable);
        return PageResponse.from(page.map(SupplierResponse::from));
    }

    @Transactional(readOnly = true)
    public SupplierResponse getById(Long id) {
        return supplierRepo.findById(id).map(SupplierResponse::from)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Supplier not found", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public SupplierResponse create(SupplierRequest req, Authentication auth) {
        var b = Supplier.builder()
                .name(req.name()).legalName(req.legalName())
                .phone(req.phone()).email(req.email())
                .taxNumber(req.taxNumber()).commercialRegister(req.commercialRegister())
                .nisNumber(req.nisNumber()).address(req.address())
                .category(req.category()).paymentTerms(req.paymentTerms())
                .notes(req.notes()).createdById(extractUserId(auth));
        if (req.openingBalance() != null) b.openingBalance(req.openingBalance());
        if (req.wilayaId() != null) b.wilaya(wilayaRepo.findById(req.wilayaId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Wilaya not found", HttpStatus.NOT_FOUND)));
        return SupplierResponse.from(supplierRepo.save(b.build()));
    }

    @Transactional
    public SupplierResponse update(Long id, SupplierRequest req) {
        var s = supplierRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Supplier not found", HttpStatus.NOT_FOUND));
        s.setName(req.name()); s.setLegalName(req.legalName());
        s.setPhone(req.phone()); s.setEmail(req.email());
        s.setTaxNumber(req.taxNumber()); s.setCommercialRegister(req.commercialRegister());
        s.setAddress(req.address()); s.setCategory(req.category());
        s.setPaymentTerms(req.paymentTerms()); s.setNotes(req.notes());
        if (req.openingBalance() != null) s.setOpeningBalance(req.openingBalance());
        s.setWilaya(req.wilayaId() != null
                ? wilayaRepo.findById(req.wilayaId()).orElse(null) : null);
        return SupplierResponse.from(supplierRepo.save(s));
    }

    @Transactional
    public void deactivate(Long id) {
        var s = supplierRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Supplier not found", HttpStatus.NOT_FOUND));
        s.setStatus("inactive");
        supplierRepo.save(s);
    }

    private Long extractUserId(Authentication auth) {
        if (auth instanceof UsernamePasswordAuthenticationToken t
                && t.getDetails() instanceof Claims c) return c.get("userId", Long.class);
        return null;
    }
}
