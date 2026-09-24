package com.allalarticle.backend.products;

import com.allalarticle.backend.products.entity.Product;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class ProductCostServiceTest {

    private ProductCostService service;
    private Product product;

    private static BigDecimal bd(String value) {
        return new BigDecimal(value);
    }

    @BeforeEach
    void setUp() {
        service = new ProductCostService();
        product = Product.builder().sku("ART-001").name("صنف").build();
    }

    @Test
    void firstReceiptTakesThePurchasePriceAsCost() {
        service.applyPurchaseReceipt(product, bd("0"), bd("100"), bd("50"));

        assertThat(product.getCostAmount()).isEqualByComparingTo("50");
        assertThat(product.getCostUpdatedAt()).isNotNull();
    }

    @Test
    void blendsExistingStockWithTheNewPurchase() {
        product.setCostAmount(bd("50"));

        // 100 on hand at 50 + 100 arriving at 70 → 12000 / 200
        service.applyPurchaseReceipt(product, bd("100"), bd("100"), bd("70"));

        assertThat(product.getCostAmount()).isEqualByComparingTo("60");
    }

    @Test
    void weightsTheAverageByQuantityRatherThanByReceiptCount() {
        product.setCostAmount(bd("10"));

        // 900 on hand at 10 + 100 arriving at 20 → 11000 / 1000, not the 15 a plain mean would give
        service.applyPurchaseReceipt(product, bd("900"), bd("100"), bd("20"));

        assertThat(product.getCostAmount()).isEqualByComparingTo("11");
    }

    @Test
    void anEmptyWarehouseResetsTheCostInsteadOfAveragingAgainstNothing() {
        product.setCostAmount(bd("50"));

        service.applyPurchaseReceipt(product, BigDecimal.ZERO, bd("10"), bd("80"));

        assertThat(product.getCostAmount()).isEqualByComparingTo("80");
    }

    @Test
    void treatsAMissingCostAsNoHistoryEvenWhenStockExists() {
        service.applyPurchaseReceipt(product, bd("40"), bd("10"), bd("25"));

        assertThat(product.getCostAmount()).isEqualByComparingTo("25");
    }

    @Test
    void keepsFourDecimalsSoRepeatedAveragingDoesNotDrift() {
        product.setCostAmount(bd("10"));

        service.applyPurchaseReceipt(product, bd("3"), bd("1"), bd("20"));

        // 50 / 4 = 12.5, carried at the full cost scale
        assertThat(product.getCostAmount()).isEqualByComparingTo("12.5");
        assertThat(product.getCostAmount().scale()).isEqualTo(4);
    }

    @Test
    void ignoresReceiptsThatCarryNoPriceOrNoQuantity() {
        product.setCostAmount(bd("50"));

        service.applyPurchaseReceipt(product, bd("10"), bd("5"), null);
        service.applyPurchaseReceipt(product, bd("10"), BigDecimal.ZERO, bd("70"));
        service.applyPurchaseReceipt(product, bd("10"), null, bd("70"));

        assertThat(product.getCostAmount()).isEqualByComparingTo("50");
        assertThat(product.getCostUpdatedAt()).isNull();
    }

    @Test
    void doesNotLetANegativeBalancePullTheCostBelowThePricePaid() {
        product.setCostAmount(bd("50"));

        service.applyPurchaseReceipt(product, bd("-20"), bd("10"), bd("70"));

        assertThat(product.getCostAmount()).isEqualByComparingTo("70");
    }
}
