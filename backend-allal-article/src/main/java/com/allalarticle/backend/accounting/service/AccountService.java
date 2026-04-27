package com.allalarticle.backend.accounting.service;

import com.allalarticle.backend.accounting.dto.AccountRequest;
import com.allalarticle.backend.accounting.dto.AccountResponse;
import com.allalarticle.backend.accounting.entity.Account;
import com.allalarticle.backend.accounting.repository.AccountRepository;
import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepo;

    @Transactional(readOnly = true)
    public List<AccountResponse> findAll() {
        return accountRepo.findByDeletedAtIsNullOrderBySortOrder().stream()
                .map(AccountResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public AccountResponse findById(Long id) {
        return AccountResponse.from(getOrThrow(id));
    }

    @Transactional
    public AccountResponse create(AccountRequest req, Long userId) {
        if (accountRepo.existsByCode(req.code())) {
            throw new AppException(ErrorCode.CONFLICT, "رمز الحساب موجود مسبقاً", HttpStatus.CONFLICT);
        }
        Account.AccountBuilder builder = Account.builder()
                .code(req.code())
                .nameAr(req.nameAr())
                .nameFr(req.nameFr())
                .classification(req.classification())
                .financialStatement(req.financialStatement())
                .normalBalance(req.normalBalance())
                .reportSection(req.reportSection())
                .statementLineCode(req.statementLineCode())
                .statementSortOrder(req.statementSortOrder())
                .postable(req.postable())
                .sortOrder(req.sortOrder())
                .custom(true)
                .createdById(userId);

        if (req.parentId() != null) {
            Account parent = getOrThrow(req.parentId());
            builder.parent(parent).level((short) (parent.getLevel() + 1));
        } else {
            builder.level((short) 1);
        }

        Account saved = accountRepo.save(builder.build());
        saved.setPath(buildPath(saved));
        return AccountResponse.from(accountRepo.save(saved));
    }

    @Transactional
    public AccountResponse update(Long id, AccountRequest req) {
        Account acc = getOrThrow(id);
        if (!acc.getCode().equals(req.code()) && accountRepo.existsByCode(req.code())) {
            throw new AppException(ErrorCode.CONFLICT, "رمز الحساب موجود مسبقاً", HttpStatus.CONFLICT);
        }
        acc.setCode(req.code());
        acc.setNameAr(req.nameAr());
        acc.setNameFr(req.nameFr());
        acc.setReportSection(req.reportSection());
        acc.setStatementLineCode(req.statementLineCode());
        acc.setStatementSortOrder(req.statementSortOrder());
        acc.setSortOrder(req.sortOrder());
        return AccountResponse.from(accountRepo.save(acc));
    }

    @Transactional
    public void delete(Long id) {
        Account acc = getOrThrow(id);
        acc.setDeletedAt(OffsetDateTime.now());
        accountRepo.save(acc);
    }

    private String buildPath(Account acc) {
        if (acc.getParent() == null) return acc.getCode();
        return acc.getParent().getPath() + "." + acc.getCode();
    }

    Account getOrThrow(Long id) {
        return accountRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "الحساب غير موجود", HttpStatus.NOT_FOUND));
    }
}
