package com.allalarticle.backend.accounting.service;

import com.allalarticle.backend.accounting.entity.*;
import com.allalarticle.backend.accounting.repository.*;
import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChartDeploymentService {

    private final AccountTemplateRepository templateRepo;
    private final AccountRepository accountRepo;
    private final ChartTemplateDeploymentRepository deploymentRepo;

    @Transactional
    public ChartTemplateDeployment deploy(Long templateId, Long userId) {
        AccountTemplate template = templateRepo.findById(templateId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "قالب دليل الحسابات غير موجود", HttpStatus.NOT_FOUND));

        int created = 0;
        Map<String, Account> codeToAccount = new HashMap<>();

        for (AccountTemplateItem item : template.getItems()) {
            if (accountRepo.existsByCode(item.getAccountCode())) {
                codeToAccount.put(item.getAccountCode(), accountRepo.findByCode(item.getAccountCode()).get());
                continue;
            }

            Account parent = item.getParentCode() != null ? codeToAccount.get(item.getParentCode()) : null;
            short level = parent != null ? (short) (parent.getLevel() + 1) : 1;

            Account account = Account.builder()
                    .code(item.getAccountCode())
                    .nameAr(item.getNameAr())
                    .nameFr(item.getNameFr())
                    .parent(parent)
                    .classification(item.getClassification())
                    .financialStatement(item.getFinancialStatement())
                    .normalBalance(item.getNormalBalance())
                    .reportSection(item.getReportSection())
                    .statementLineCode(item.getStatementLineCode())
                    .statementSortOrder(item.getStatementSortOrder())
                    .postable(item.isPostable())
                    .sortOrder(item.getSortOrder())
                    .level(level)
                    .templateItemId(item.getId())
                    .templateLocked(true)
                    .build();

            Account saved = accountRepo.save(account);
            saved.setPath(parent != null ? parent.getPath() + "." + saved.getCode() : saved.getCode());
            accountRepo.save(saved);
            codeToAccount.put(saved.getCode(), saved);
            created++;
        }

        ChartTemplateDeployment deployment = ChartTemplateDeployment.builder()
                .template(template)
                .accountsCreated(created)
                .deployedById(userId)
                .build();
        return deploymentRepo.save(deployment);
    }
}
