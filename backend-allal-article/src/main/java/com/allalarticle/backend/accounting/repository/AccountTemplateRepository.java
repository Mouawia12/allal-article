package com.allalarticle.backend.accounting.repository;

import com.allalarticle.backend.accounting.entity.AccountTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccountTemplateRepository extends JpaRepository<AccountTemplate, Long> {
    Optional<AccountTemplate> findByIsDefaultTrue();
    List<AccountTemplate> findAllByOrderByCode();
}
