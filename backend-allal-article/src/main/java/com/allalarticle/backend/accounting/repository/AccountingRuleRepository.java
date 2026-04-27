package com.allalarticle.backend.accounting.repository;

import com.allalarticle.backend.accounting.entity.AccountingRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AccountingRuleRepository extends JpaRepository<AccountingRule, Long> {
    Optional<AccountingRule> findByRuleCodeAndActiveTrue(String ruleCode);
}
