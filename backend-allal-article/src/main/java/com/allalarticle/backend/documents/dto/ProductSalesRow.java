package com.allalarticle.backend.documents.dto;

import java.math.BigDecimal;

public record ProductSalesRow(
        Long productId,
        String productName,
        String productCode,
        BigDecimal totalQtyShipped,
        BigDecimal totalRevenue,
        long orderCount
) {}
