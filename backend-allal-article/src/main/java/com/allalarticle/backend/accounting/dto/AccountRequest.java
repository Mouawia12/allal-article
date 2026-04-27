package com.allalarticle.backend.accounting.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AccountRequest(
        @NotBlank @Size(min = 2, max = 30) String code,
        @NotBlank @Size(max = 200) String nameAr,
        @Size(max = 200) String nameFr,
        Long parentId,
        @NotBlank String classification,
        String financialStatement,
        @NotBlank String normalBalance,
        String reportSection,
        String statementLineCode,
        int statementSortOrder,
        boolean postable,
        int sortOrder
) {}
