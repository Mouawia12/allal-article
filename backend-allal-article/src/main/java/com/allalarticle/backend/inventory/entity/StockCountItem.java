package com.allalarticle.backend.inventory.entity;

import com.allalarticle.backend.products.entity.Product;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/** One product on a count sheet: what the system believed, and what was actually found. */
@Entity
@Table(name = "stock_count_items")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class StockCountItem {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_count_id", nullable = false)
    private StockCount stockCount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /** Frozen when the count was opened, so later sales cannot move the baseline. */
    @Column(name = "system_qty", nullable = false, precision = 14, scale = 3)
    private BigDecimal systemQty;

    /** Frozen too: the variance must be valued at the cost that applied on the day of the count. */
    @Column(name = "unit_cost", precision = 14, scale = 4)
    private BigDecimal unitCost;

    /** Null until somebody counts — a blank cell and a counted zero are different facts. */
    @Column(name = "counted_qty", precision = 14, scale = 3)
    private BigDecimal countedQty;

    /** An independent second count; when present it is the one that counts. */
    @Column(name = "recount_qty", precision = 14, scale = 3)
    private BigDecimal recountQty;

    @Column(length = 120)
    private String reason;

    private String notes;

    @Column(name = "counted_by")
    private Long countedBy;

    @Column(name = "counted_at")
    private OffsetDateTime countedAt;

    /** The quantity that will be applied: the recount when one was made, otherwise the first count. */
    public BigDecimal finalQty() {
        return recountQty != null ? recountQty : countedQty;
    }

    public boolean isCounted() {
        return finalQty() != null;
    }

    /** Positive when more was found than expected, negative when stock is missing. */
    public BigDecimal difference() {
        BigDecimal counted = finalQty();
        return counted == null ? null : counted.subtract(systemQty);
    }

    /** The difference valued at the frozen cost, or null when the product has no cost yet. */
    public BigDecimal differenceValue() {
        BigDecimal diff = difference();
        return diff == null || unitCost == null ? null : diff.multiply(unitCost);
    }
}
