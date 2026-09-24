package com.allalarticle.backend.products;

import com.allalarticle.backend.products.entity.Product;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;

/**
 * Keeps each product's weighted average unit cost (CMP — coût moyen pondéré) up to date.
 *
 * The cost is what stock is worth on the books, which is not the selling price: valuing an
 * inventory count variance at the selling price would inflate the loss by the profit margin.
 */
@Service
public class ProductCostService {

    /** Money kept to four decimals so repeated averaging does not drift on cheap, high-volume items. */
    private static final int COST_SCALE = 4;

    /**
     * Blends the cost of what is already on hand with the cost of what just arrived:
     *
     * <pre>newCost = (qtyOnHand × oldCost + receivedQty × purchasePrice) ÷ (qtyOnHand + receivedQty)</pre>
     *
     * When nothing is on hand, or no cost has been recorded yet, the purchase price becomes the
     * cost outright — there is no earlier cost to average against.
     *
     * @param qtyOnHandBefore total quantity across every warehouse, taken before this receipt
     */
    public void applyPurchaseReceipt(Product product,
                                     BigDecimal qtyOnHandBefore,
                                     BigDecimal receivedQty,
                                     BigDecimal purchaseUnitPrice) {
        if (product == null
                || purchaseUnitPrice == null
                || purchaseUnitPrice.signum() < 0
                || receivedQty == null
                || receivedQty.signum() <= 0) {
            return;
        }

        // A negative balance is a data fault, not a quantity to average against.
        BigDecimal onHand = qtyOnHandBefore == null
                ? BigDecimal.ZERO
                : qtyOnHandBefore.max(BigDecimal.ZERO);
        BigDecimal oldCost = product.getCostAmount();

        BigDecimal newCost;
        if (oldCost == null || onHand.signum() == 0) {
            newCost = purchaseUnitPrice;
        } else {
            BigDecimal existingValue = onHand.multiply(oldCost);
            BigDecimal arrivingValue = receivedQty.multiply(purchaseUnitPrice);
            newCost = existingValue.add(arrivingValue)
                    .divide(onHand.add(receivedQty), COST_SCALE, RoundingMode.HALF_UP);
        }

        product.setCostAmount(newCost.setScale(COST_SCALE, RoundingMode.HALF_UP));
        product.setCostUpdatedAt(OffsetDateTime.now());
    }
}
