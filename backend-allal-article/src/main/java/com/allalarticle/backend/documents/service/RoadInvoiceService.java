package com.allalarticle.backend.documents.service;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.customers.entity.Customer;
import com.allalarticle.backend.customers.CustomerRepository;
import com.allalarticle.backend.documents.dto.RoadInvoiceRequest;
import com.allalarticle.backend.documents.dto.RoadInvoiceResponse;
import com.allalarticle.backend.documents.entity.RoadInvoice;
import com.allalarticle.backend.documents.entity.RoadInvoiceItem;
import com.allalarticle.backend.documents.entity.RoadInvoiceWilayaDefault;
import com.allalarticle.backend.documents.repository.RoadInvoiceRepository;
import com.allalarticle.backend.documents.repository.RoadInvoiceWilayaDefaultRepository;
import com.allalarticle.backend.orders.OrderRepository;
import com.allalarticle.backend.orders.entity.Order;
import com.allalarticle.backend.products.ProductRepository;
import com.allalarticle.backend.products.entity.Product;
import com.allalarticle.backend.reference.WilayaRepository;
import com.allalarticle.backend.reference.entity.Wilaya;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RoadInvoiceService {

    private final RoadInvoiceRepository invoiceRepo;
    private final RoadInvoiceWilayaDefaultRepository wilayaDefaultRepo;
    private final WilayaRepository wilayaRepo;
    private final CustomerRepository customerRepo;
    private final ProductRepository productRepo;
    private final OrderRepository orderRepo;

    @Transactional(readOnly = true)
    public Page<RoadInvoiceResponse> list(String status, Pageable pageable) {
        if (status != null) return invoiceRepo.findByStatus(status, pageable).map(RoadInvoiceResponse::from);
        return invoiceRepo.findAll(pageable).map(RoadInvoiceResponse::from);
    }

    @Transactional(readOnly = true)
    public RoadInvoiceResponse findById(Long id) {
        return RoadInvoiceResponse.from(getOrThrow(id));
    }

    @Transactional
    public RoadInvoiceResponse create(RoadInvoiceRequest req, Long userId) {
        Wilaya wilaya = req.wilayaId() != null
                ? wilayaRepo.findById(req.wilayaId()).orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "الولاية غير موجودة", HttpStatus.NOT_FOUND))
                : null;
        Customer customer = req.customerId() != null
                ? customerRepo.findById(req.customerId()).orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "العميل غير موجود", HttpStatus.NOT_FOUND))
                : null;

        RoadInvoice invoice = RoadInvoice.builder()
                .invoiceNumber("TEMP")
                .invoiceDate(req.invoiceDate())
                .wilaya(wilaya)
                .customer(customer)
                .driverId(req.driverId())
                .notes(req.notes())
                .createdById(userId)
                .build();

        List<RoadInvoiceItem> items = buildItems(invoice, req.items());
        invoice.getItems().addAll(items);
        invoice.setTotalWeight(items.stream().map(i -> i.getLineWeight() != null ? i.getLineWeight() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add));

        if (req.orderIds() != null && !req.orderIds().isEmpty()) {
            Set<Order> orders = new HashSet<>();
            for (Long orderId : req.orderIds()) {
                orders.add(orderRepo.findById(orderId)
                        .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "الطلب غير موجود: " + orderId, HttpStatus.NOT_FOUND)));
            }
            invoice.setLinkedOrders(orders);
        }

        RoadInvoice saved = invoiceRepo.save(invoice);
        saved.setInvoiceNumber("RI-" + Year.now() + "-" + String.format("%06d", saved.getId()));
        return RoadInvoiceResponse.from(invoiceRepo.save(saved));
    }

    @Transactional
    public RoadInvoiceResponse confirm(Long id) {
        RoadInvoice invoice = getOrThrow(id);
        if (!"draft".equals(invoice.getStatus())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "فاتورة الطريق ليست في حالة مسودة", HttpStatus.BAD_REQUEST);
        }
        invoice.setStatus("confirmed");
        return RoadInvoiceResponse.from(invoiceRepo.save(invoice));
    }

    @Transactional
    public RoadInvoiceResponse recordPrint(Long id, Long userId) {
        RoadInvoice invoice = getOrThrow(id);
        invoice.setPrintCount(invoice.getPrintCount() + 1);
        invoice.setLastPrintedAt(OffsetDateTime.now());
        invoice.setLastPrintedById(userId);
        return RoadInvoiceResponse.from(invoiceRepo.save(invoice));
    }

    @Transactional
    public RoadInvoiceResponse recordWhatsapp(Long id) {
        RoadInvoice invoice = getOrThrow(id);
        invoice.setWhatsappSentAt(OffsetDateTime.now());
        return RoadInvoiceResponse.from(invoiceRepo.save(invoice));
    }

    @Transactional
    public void setWilayaDefault(Long wilayaId, Long customerId, Long userId) {
        Wilaya wilaya = wilayaRepo.findById(wilayaId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "الولاية غير موجودة", HttpStatus.NOT_FOUND));
        Customer customer = customerRepo.findById(customerId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "العميل غير موجود", HttpStatus.NOT_FOUND));

        RoadInvoiceWilayaDefault def = wilayaDefaultRepo.findByWilayaId(wilayaId)
                .orElseGet(() -> RoadInvoiceWilayaDefault.builder().wilayaId(wilayaId).wilaya(wilaya).build());
        def.setCustomer(customer);
        def.setUpdatedById(userId);
        wilayaDefaultRepo.save(def);
    }

    private List<RoadInvoiceItem> buildItems(RoadInvoice invoice, List<RoadInvoiceRequest.ItemRequest> itemReqs) {
        List<RoadInvoiceItem> items = new ArrayList<>();
        for (RoadInvoiceRequest.ItemRequest ir : itemReqs) {
            Product product = productRepo.findById(ir.productId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "المنتج غير موجود: " + ir.productId(), HttpStatus.NOT_FOUND));
            items.add(RoadInvoiceItem.builder()
                    .roadInvoice(invoice)
                    .product(product)
                    .quantity(ir.quantity())
                    .unitPrice(ir.unitPrice())
                    .lineWeight(ir.lineWeight())
                    .notes(ir.notes())
                    .build());
        }
        return items;
    }

    private RoadInvoice getOrThrow(Long id) {
        return invoiceRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "فاتورة الطريق غير موجودة", HttpStatus.NOT_FOUND));
    }
}
