package com.allalarticle.backend.returns.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record CreateReturnRequest(
        Long orderId,
        Long customerId,
        @NotNull LocalDate returnDate,
        String notes,
        @NotEmpty @Valid List<ReturnItemRequest> items
) {}
