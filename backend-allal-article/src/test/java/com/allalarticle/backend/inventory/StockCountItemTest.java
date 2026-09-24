package com.allalarticle.backend.inventory;

import com.allalarticle.backend.inventory.entity.StockCountItem;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

/** The variance arithmetic every screen and every adjustment ultimately reads. */
class StockCountItemTest {

    private static StockCountItem line(String systemQty, String countedQty, String cost) {
        return StockCountItem.builder()
                .systemQty(new BigDecimal(systemQty))
                .countedQty(countedQty == null ? null : new BigDecimal(countedQty))
                .unitCost(cost == null ? null : new BigDecimal(cost))
                .build();
    }

    @Test
    void anUncountedLineHasNoDifferenceRatherThanADifferenceOfZero() {
        var item = line("100", null, "50");

        assertThat(item.isCounted()).isFalse();
        assertThat(item.difference()).isNull();
        assertThat(item.differenceValue()).isNull();
    }

    @Test
    void countingZeroIsAFullShortfall_notAnUncountedLine() {
        var item = line("100", "0", "50");

        assertThat(item.isCounted()).isTrue();
        assertThat(item.difference()).isEqualByComparingTo("-100");
        assertThat(item.differenceValue()).isEqualByComparingTo("-5000");
    }

    @Test
    void findingMoreThanExpectedGivesAPositiveDifference() {
        var item = line("80", "95", "20");

        assertThat(item.difference()).isEqualByComparingTo("15");
        assertThat(item.differenceValue()).isEqualByComparingTo("300");
    }

    @Test
    void aRecountSupersedesTheFirstCount() {
        var item = line("100", "60", "50");
        item.setRecountQty(new BigDecimal("98"));

        assertThat(item.finalQty()).isEqualByComparingTo("98");
        assertThat(item.difference()).isEqualByComparingTo("-2");
        assertThat(item.differenceValue()).isEqualByComparingTo("-100");
    }

    @Test
    void aRecountOfZeroStillSupersedes() {
        var item = line("40", "40", "10");
        item.setRecountQty(BigDecimal.ZERO);

        assertThat(item.finalQty()).isEqualByComparingTo("0");
        assertThat(item.difference()).isEqualByComparingTo("-40");
    }

    @Test
    void aMatchingCountHasNoVariance() {
        var item = line("250", "250", "12");

        assertThat(item.difference()).isEqualByComparingTo("0");
        assertThat(item.differenceValue()).isEqualByComparingTo("0");
    }

    @Test
    void aProductWithoutACostStillReportsItsQuantityVariance() {
        var item = line("100", "90", null);

        assertThat(item.difference()).isEqualByComparingTo("-10");
        assertThat(item.differenceValue())
                .as("an unvalued variance must stay null rather than silently count as zero")
                .isNull();
    }
}
