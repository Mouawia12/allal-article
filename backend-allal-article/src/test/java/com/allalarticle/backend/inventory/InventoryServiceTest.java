package com.allalarticle.backend.inventory;

import com.allalarticle.backend.audit.AuditLogService;
import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.inventory.dto.StockTransferRequest;
import com.allalarticle.backend.inventory.entity.ProductStock;
import com.allalarticle.backend.inventory.entity.StockMovement;
import com.allalarticle.backend.inventory.entity.Warehouse;
import com.allalarticle.backend.products.ProductRepository;
import com.allalarticle.backend.products.entity.Product;
import com.allalarticle.backend.users.TenantUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock ProductStockRepository stockRepo;
    @Mock StockMovementRepository movementRepo;
    @Mock ProductRepository productRepo;
    @Mock WarehouseRepository warehouseRepo;
    @Mock WarehouseService warehouseService;
    @Mock TenantUserRepository userRepo;
    @Mock AuditLogService auditLogService;

    @InjectMocks InventoryService service;

    private Product product;
    private Warehouse sourceWarehouse;
    private Warehouse targetWarehouse;

    @BeforeEach
    void setUp() {
        product = new Product();
        product.setId(1L);
        product.setName("Test Product");

        sourceWarehouse = Warehouse.builder().code("SRC").name("Source").build();
        sourceWarehouse.setId(10L);
        targetWarehouse = Warehouse.builder().code("DST").name("Target").build();
        targetWarehouse.setId(20L);
    }

    @Test
    void transfer_movesAvailableQtyAndWritesTwoMovements() {
        var sourceStock = ProductStock.builder()
                .product(product)
                .warehouse(sourceWarehouse)
                .onHandQty(new BigDecimal("10"))
                .reservedQty(new BigDecimal("2"))
                .availableQty(new BigDecimal("8"))
                .build();
        var targetStock = ProductStock.builder()
                .product(product)
                .warehouse(targetWarehouse)
                .onHandQty(new BigDecimal("3"))
                .reservedQty(BigDecimal.ZERO)
                .availableQty(new BigDecimal("3"))
                .build();
        var movementIds = new AtomicLong(1);

        when(productRepo.findById(1L)).thenReturn(Optional.of(product));
        when(warehouseRepo.findById(10L)).thenReturn(Optional.of(sourceWarehouse));
        when(warehouseRepo.findById(20L)).thenReturn(Optional.of(targetWarehouse));
        when(stockRepo.findForUpdate(1L, 10L)).thenReturn(Optional.of(sourceStock));
        when(stockRepo.findForUpdate(1L, 20L)).thenReturn(Optional.of(targetStock));
        when(stockRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(movementRepo.save(any())).thenAnswer(inv -> {
            StockMovement movement = inv.getArgument(0);
            movement.setId(movementIds.getAndIncrement());
            return movement;
        });

        var response = service.transfer(
                new StockTransferRequest(1L, 10L, 20L, new BigDecimal("5"), "Move stock"),
                null);

        assertThat(response).hasSize(2);
        assertThat(sourceStock.getOnHandQty()).isEqualByComparingTo("5");
        assertThat(sourceStock.getAvailableQty()).isEqualByComparingTo("3");
        assertThat(targetStock.getOnHandQty()).isEqualByComparingTo("8");
        assertThat(targetStock.getAvailableQty()).isEqualByComparingTo("8");
        verify(movementRepo, times(2)).save(any());
    }

    @Test
    void transfer_rejectsQtyAboveAvailable() {
        var sourceStock = ProductStock.builder()
                .product(product)
                .warehouse(sourceWarehouse)
                .onHandQty(new BigDecimal("4"))
                .reservedQty(new BigDecimal("2"))
                .availableQty(new BigDecimal("2"))
                .build();

        when(productRepo.findById(1L)).thenReturn(Optional.of(product));
        when(warehouseRepo.findById(10L)).thenReturn(Optional.of(sourceWarehouse));
        when(warehouseRepo.findById(20L)).thenReturn(Optional.of(targetWarehouse));
        when(stockRepo.findForUpdate(1L, 10L)).thenReturn(Optional.of(sourceStock));

        assertThatThrownBy(() -> service.transfer(
                new StockTransferRequest(1L, 10L, 20L, new BigDecimal("3"), null),
                null))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("الكمية أكبر من المتاح");

        verify(movementRepo, never()).save(any());
    }
}
