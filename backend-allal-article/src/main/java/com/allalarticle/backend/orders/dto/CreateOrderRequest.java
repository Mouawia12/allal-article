package com.allalarticle.backend.orders.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record CreateOrderRequest(
        Long customerId,
        Long salesUserId,
        String priceListId,
        String notes,
        String internalNotes,
        @NotEmpty @Valid List<OrderItemRequest> items
) {}
