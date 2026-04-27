package com.allalarticle.backend.returns.dto;

import java.math.BigDecimal;
import java.util.Map;

public record AcceptReturnRequest(
        Map<Long, BigDecimal> acceptedQtyByItemId,
        Long warehouseId
) {}
