package com.allalarticle.backend.accounting.service;

import com.allalarticle.backend.accounting.entity.NumberSequence;
import com.allalarticle.backend.accounting.repository.NumberSequenceRepository;
import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NumberSequenceService {

    private final NumberSequenceRepository repo;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String next(String sequenceKey) {
        NumberSequence seq = repo.findForUpdate(sequenceKey)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "تسلسل الترقيم غير موجود: " + sequenceKey, HttpStatus.INTERNAL_SERVER_ERROR));
        String number = seq.generateAndIncrement();
        repo.save(seq);
        return number;
    }
}
