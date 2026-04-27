package com.allalarticle.backend.documents.dto;

import java.math.BigDecimal;

public record SalesReportRow(
        Long entityId,
        String entityName,
        long orderCount,
        BigDecimal totalAmount,
        BigDecimal totalWeight
) {}
