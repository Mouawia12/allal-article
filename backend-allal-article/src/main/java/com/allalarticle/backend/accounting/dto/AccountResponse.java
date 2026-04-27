package com.allalarticle.backend.accounting.dto;

import com.allalarticle.backend.accounting.entity.Account;

import java.util.UUID;

public record AccountResponse(
        Long id,
        UUID publicId,
        String code,
        String nameAr,
        String nameFr,
        Long parentId,
        String parentCode,
        String classification,
        String financialStatement,
        String normalBalance,
        String reportSection,
        String statementLineCode,
        int statementSortOrder,
        boolean postable,
        boolean control,
        String currency,
        String status,
        short level,
        String path,
        int sortOrder
) {
    public static AccountResponse from(Account a) {
        return new AccountResponse(
                a.getId(), a.getPublicId(), a.getCode(), a.getNameAr(), a.getNameFr(),
                a.getParent() != null ? a.getParent().getId() : null,
                a.getParent() != null ? a.getParent().getCode() : null,
                a.getClassification(), a.getFinancialStatement(), a.getNormalBalance(),
                a.getReportSection(), a.getStatementLineCode(), a.getStatementSortOrder(),
                a.isPostable(), a.isControl(), a.getCurrency(), a.getStatus(),
                a.getLevel(), a.getPath(), a.getSortOrder()
        );
    }
}
