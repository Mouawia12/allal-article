package com.allalarticle.backend.inventory.dto;

import com.allalarticle.backend.inventory.entity.StockCount;
import com.allalarticle.backend.inventory.entity.StockCountItem;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record StockCountResponse(
        Long id,
        String reference,
        Long warehouseId,
        String warehouseName,
        String status,
        boolean blind,
        LocalDate scheduledFor,
        String notes,
        int totalItems,
        int countedItems,
        int varianceItems,
        BigDecimal netVarianceQty,
        BigDecimal netVarianceValue,
        int itemsWithoutCost,
        OffsetDateTime createdAt,
        OffsetDateTime closedAt,
        OffsetDateTime approvedAt,
        String journalNumber,
        List<StockCountItemResponse> items
) {
    public static StockCountResponse summary(StockCount count, List<StockCountItem> items) {
        return build(count, items, null);
    }

    public static StockCountResponse detail(StockCount count, List<StockCountItem> items) {
        // The system quantity stays hidden while a blind count is still open; once it moves to
        // review the differences are the whole point of the screen.
        boolean hide = count.isBlind() && StockCount.OPEN.equals(count.getStatus());
        return build(count, items, hide);
    }

    private static StockCountResponse build(StockCount count, List<StockCountItem> items, Boolean hideSystemQty) {
        int counted = 0;
        int variances = 0;
        int withoutCost = 0;
        BigDecimal netQty = BigDecimal.ZERO;
        BigDecimal netValue = BigDecimal.ZERO;

        for (StockCountItem item : items) {
            if (!item.isCounted()) continue;
            counted++;
            BigDecimal diff = item.difference();
            if (diff.signum() != 0) {
                variances++;
                netQty = netQty.add(diff);
                if (item.getUnitCost() == null) {
                    withoutCost++;
                } else {
                    netValue = netValue.add(item.differenceValue());
                }
            }
        }

        var warehouse = count.getWarehouse();
        return new StockCountResponse(
                count.getId(), count.getReference(),
                warehouse.getId(), warehouse.getName(),
                count.getStatus(), count.isBlind(), count.getScheduledFor(), count.getNotes(),
                items.size(), counted, variances, netQty, netValue, withoutCost,
                count.getCreatedAt(), count.getClosedAt(), count.getApprovedAt(),
                count.getJournalNumber(),
                hideSystemQty == null
                        ? null
                        : items.stream().map(i -> StockCountItemResponse.from(i, hideSystemQty)).toList()
        );
    }
}
