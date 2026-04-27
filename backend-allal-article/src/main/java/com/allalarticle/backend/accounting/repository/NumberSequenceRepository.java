package com.allalarticle.backend.accounting.repository;

import com.allalarticle.backend.accounting.entity.NumberSequence;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface NumberSequenceRepository extends JpaRepository<NumberSequence, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ns FROM NumberSequence ns WHERE ns.sequenceKey = :key")
    Optional<NumberSequence> findForUpdate(String key);
}
