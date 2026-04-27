package com.allalarticle.backend.purchases.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

public record ReceivePurchaseRequest(
        LocalDate receivedDate,
        Long warehouseId,
        Map<Long, BigDecimal> receivedQtyByItemId
) {}
