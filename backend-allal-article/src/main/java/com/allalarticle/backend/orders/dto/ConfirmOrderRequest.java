package com.allalarticle.backend.orders.dto;

import java.math.BigDecimal;
import java.util.Map;

public record ConfirmOrderRequest(
        Map<Long, BigDecimal> approvedQtyByItemId,
        String internalNotes
) {}
