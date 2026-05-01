package com.allalarticle.backend.products;

import com.allalarticle.backend.audit.AuditLogService;
import com.allalarticle.backend.products.dto.ProductRequest;
import com.allalarticle.backend.products.entity.Product;
import com.allalarticle.backend.products.entity.ProductPriceHistory;
import com.allalarticle.backend.products.entity.ProductUnit;
import com.allalarticle.backend.users.TenantUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock ProductRepository productRepo;
    @Mock CategoryRepository categoryRepo;
    @Mock ProductUnitRepository unitRepo;
    @Mock ProductPriceHistoryRepository priceHistoryRepo;
    @Mock TenantUserRepository userRepo;
    @Mock AuditLogService auditLogService;

    @InjectMocks ProductService service;

    private ProductUnit unit;

    @BeforeEach
    void setUp() {
        unit = ProductUnit.builder().id(1L).name("قطعة").symbol("قطعة").build();
    }

    @Test
    void create_withInitialPrice_recordsPriceHistoryBaseline() {
        when(productRepo.existsBySku("AI-1")).thenReturn(false);
        when(unitRepo.findById(1L)).thenReturn(Optional.of(unit));
        when(productRepo.save(any())).thenAnswer(inv -> {
            Product product = inv.getArgument(0);
            product.setId(10L);
            return product;
        });

        service.create(new ProductRequest(
                "AI-1", "صنف", null, 1L, null,
                BigDecimal.ONE, new BigDecimal("1000"), BigDecimal.ZERO, null, "active"
        ), null);

        ArgumentCaptor<ProductPriceHistory> captor = ArgumentCaptor.forClass(ProductPriceHistory.class);
        verify(priceHistoryRepo).save(captor.capture());
        assertThat(captor.getValue().getProduct().getId()).isEqualTo(10L);
        assertThat(captor.getValue().getPreviousPriceAmount()).isNull();
        assertThat(captor.getValue().getNewPriceAmount()).isEqualByComparingTo("1000");
        assertThat(captor.getValue().getSourceType()).isEqualTo("product_create");
    }

    @Test
    void update_withChangedPrice_recordsPriceHistory() {
        Product product = Product.builder()
                .sku("AI-1")
                .name("صنف")
                .baseUnit(unit)
                .currentPriceAmount(new BigDecimal("1000"))
                .build();
        product.setId(10L);

        when(productRepo.findById(10L)).thenReturn(Optional.of(product));
        when(unitRepo.findById(1L)).thenReturn(Optional.of(unit));
        when(productRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.update(10L, new ProductRequest(
                "AI-1", "صنف", null, 1L, null,
                BigDecimal.ONE, new BigDecimal("1250"), BigDecimal.ZERO, null, "active"
        ), null);

        ArgumentCaptor<ProductPriceHistory> captor = ArgumentCaptor.forClass(ProductPriceHistory.class);
        verify(priceHistoryRepo).save(captor.capture());
        assertThat(captor.getValue().getPreviousPriceAmount()).isEqualByComparingTo("1000");
        assertThat(captor.getValue().getNewPriceAmount()).isEqualByComparingTo("1250");
        assertThat(captor.getValue().getSourceType()).isEqualTo("product_update");
    }

    @Test
    void update_withSamePrice_doesNotRecordPriceHistory() {
        Product product = Product.builder()
                .sku("AI-1")
                .name("صنف")
                .baseUnit(unit)
                .currentPriceAmount(new BigDecimal("1000.00"))
                .build();
        product.setId(10L);

        when(productRepo.findById(10L)).thenReturn(Optional.of(product));
        when(unitRepo.findById(1L)).thenReturn(Optional.of(unit));
        when(productRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.update(10L, new ProductRequest(
                "AI-1", "صنف", null, 1L, null,
                BigDecimal.ONE, new BigDecimal("1000"), BigDecimal.ZERO, null, "active"
        ), null);

        verify(priceHistoryRepo, never()).save(any());
    }

    @Test
    void getPriceHistory_withoutRows_createsCurrentPriceBaseline() {
        Product product = Product.builder()
                .sku("AI-1")
                .name("صنف")
                .baseUnit(unit)
                .currentPriceAmount(new BigDecimal("1000"))
                .build();
        product.setId(10L);

        ProductPriceHistory baseline = ProductPriceHistory.builder()
                .product(product)
                .newPriceAmount(new BigDecimal("1000"))
                .sourceType("current_price_baseline")
                .build();
        baseline.setId(1L);

        when(productRepo.findById(10L)).thenReturn(Optional.of(product));
        when(priceHistoryRepo.findByProductIdOrderByEffectiveAtDescCreatedAtDesc(10L))
                .thenReturn(List.of())
                .thenReturn(List.of(baseline));
        when(priceHistoryRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var history = service.getPriceHistory(10L);

        assertThat(history).hasSize(1);
        assertThat(history.get(0).sourceType()).isEqualTo("current_price_baseline");
        verify(priceHistoryRepo).save(any(ProductPriceHistory.class));
    }
}
