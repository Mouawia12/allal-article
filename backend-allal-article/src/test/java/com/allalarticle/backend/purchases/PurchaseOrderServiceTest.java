package com.allalarticle.backend.purchases;

import com.allalarticle.backend.audit.AuditLogService;
import com.allalarticle.backend.inventory.ProductStockRepository;
import com.allalarticle.backend.inventory.StockMovementRepository;
import com.allalarticle.backend.inventory.WarehouseRepository;
import com.allalarticle.backend.partnerships.PartnerDocumentSyncService;
import com.allalarticle.backend.products.PriceListPricingService;
import com.allalarticle.backend.products.ProductRepository;
import com.allalarticle.backend.products.entity.Product;
import com.allalarticle.backend.purchases.dto.CreatePurchaseOrderRequest;
import com.allalarticle.backend.purchases.dto.PurchaseItemRequest;
import com.allalarticle.backend.purchases.entity.PurchaseOrder;
import com.allalarticle.backend.suppliers.SupplierRepository;
import com.allalarticle.backend.suppliers.entity.Supplier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PurchaseOrderServiceTest {

    @Mock PurchaseOrderRepository poRepo;
    @Mock ProductRepository productRepo;
    @Mock SupplierRepository supplierRepo;
    @Mock WarehouseRepository warehouseRepo;
    @Mock ProductStockRepository stockRepo;
    @Mock StockMovementRepository movementRepo;
    @Mock AuditLogService auditLogService;
    @Mock JdbcTemplate jdbc;
    @Mock PartnerDocumentSyncService partnerDocumentSyncService;
    @Mock PriceListPricingService pricingService;

    @InjectMocks PurchaseOrderService service;

    private Product product;
    private Supplier supplier;

    @BeforeEach
    void setUp() {
        product = new Product();
        product.setId(1L);
        product.setSku("SKU-1");
        product.setName("Test Product");
        product.setCurrentPriceAmount(new BigDecimal("1000"));
        product.setPriceCurrency("DZD");

        supplier = Supplier.builder().name("Test Supplier").build();
        supplier.setId(1L);
    }

    @Test
    void create_withPurchasePriceList_usesResolvedListPrice() {
        var listPricing = new PriceListPricingService.PriceResolution(
                11L, "أسعار شراء المورد", "DZD", 111L,
                new BigDecimal("1000"), new BigDecimal("760"), "price_list");

        when(supplierRepo.findById(1L)).thenReturn(Optional.of(supplier));
        when(productRepo.findById(1L)).thenReturn(Optional.of(product));
        when(poRepo.save(any())).thenAnswer(inv -> {
            PurchaseOrder po = inv.getArgument(0);
            po.setId(1L);
            return po;
        });
        when(pricingService.resolvePrice(eq("11"), eq("purchase"), eq(1L), any(), any(), eq("DZD")))
                .thenReturn(listPricing);
        when(pricingService.applyManualOverrideIfNeeded(any(), any(), any(), any()))
                .thenAnswer(inv -> inv.getArgument(0));

        var req = new CreatePurchaseOrderRequest(
                1L,
                "11",
                LocalDate.of(2026, 5, 10),
                null,
                List.of(new PurchaseItemRequest(1L, new BigDecimal("3"), null, null)));

        var resp = service.create(req, null);

        assertThat(resp.poNumber()).startsWith("PO-");
        assertThat(resp.priceListId()).isEqualTo(11L);
        assertThat(resp.priceListName()).isEqualTo("أسعار شراء المورد");
        assertThat(resp.totalAmount()).isEqualByComparingTo("2280");
        assertThat(resp.items()).hasSize(1);
        assertThat(resp.items().get(0).priceListItemId()).isEqualTo(111L);
        assertThat(resp.items().get(0).unitPrice()).isEqualByComparingTo("760");
        assertThat(resp.items().get(0).pricingSource()).isEqualTo("price_list");
    }

    @Test
    void create_withMainRequest_usesSupplierDefaultPriceList() {
        supplier.setPriceListId(11L);
        var listPricing = new PriceListPricingService.PriceResolution(
                11L, "أسعار شراء المورد", "DZD", 111L,
                new BigDecimal("1000"), new BigDecimal("760"), "price_list");

        when(supplierRepo.findById(1L)).thenReturn(Optional.of(supplier));
        when(productRepo.findById(1L)).thenReturn(Optional.of(product));
        when(poRepo.save(any())).thenAnswer(inv -> {
            PurchaseOrder po = inv.getArgument(0);
            po.setId(1L);
            return po;
        });
        when(pricingService.resolvePrice(eq("11"), eq("purchase"), eq(1L), any(), any(), eq("DZD")))
                .thenReturn(listPricing);
        when(pricingService.applyManualOverrideIfNeeded(any(), any(), any(), any()))
                .thenAnswer(inv -> inv.getArgument(0));

        var req = new CreatePurchaseOrderRequest(
                1L,
                "PURCHASE_MAIN",
                LocalDate.of(2026, 5, 10),
                null,
                List.of(new PurchaseItemRequest(1L, new BigDecimal("3"), null, null)));

        var resp = service.create(req, null);

        assertThat(resp.priceListId()).isEqualTo(11L);
        assertThat(resp.priceListName()).isEqualTo("أسعار شراء المورد");
        assertThat(resp.totalAmount()).isEqualByComparingTo("2280");
        assertThat(resp.items().get(0).unitPrice()).isEqualByComparingTo("760");
    }

    @Test
    void create_withoutPriceList_usesManualUnitPriceWhenItDiffersFromProductDefault() {
        var defaultPricing = PriceListPricingService.PriceResolution.productDefault(new BigDecimal("1000"), "DZD");
        var manualPricing = PriceListPricingService.PriceResolution.manualOverride(
                new BigDecimal("920"), new BigDecimal("1000"), "DZD");

        when(supplierRepo.findById(1L)).thenReturn(Optional.of(supplier));
        when(productRepo.findById(1L)).thenReturn(Optional.of(product));
        when(poRepo.save(any())).thenAnswer(inv -> {
            PurchaseOrder po = inv.getArgument(0);
            po.setId(1L);
            return po;
        });
        when(pricingService.resolvePrice(eq(null), eq("purchase"), eq(1L), any(), any(), eq("DZD")))
                .thenReturn(defaultPricing);
        when(pricingService.applyManualOverrideIfNeeded(eq(defaultPricing), eq(new BigDecimal("920")), any(), eq("DZD")))
                .thenReturn(manualPricing);

        var req = new CreatePurchaseOrderRequest(
                1L,
                null,
                LocalDate.of(2026, 5, 10),
                null,
                List.of(new PurchaseItemRequest(1L, new BigDecimal("2"), new BigDecimal("920"), null)));

        var resp = service.create(req, null);

        assertThat(resp.priceListId()).isNull();
        assertThat(resp.totalAmount()).isEqualByComparingTo("1840");
        assertThat(resp.items().get(0).unitPrice()).isEqualByComparingTo("920");
        assertThat(resp.items().get(0).pricingSource()).isEqualTo("manual_override");
    }
}
