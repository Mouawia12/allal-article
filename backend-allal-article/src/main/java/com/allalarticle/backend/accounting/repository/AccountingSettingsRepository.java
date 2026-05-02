package com.allalarticle.backend.accounting.repository;

import com.allalarticle.backend.accounting.entity.AccountingSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AccountingSettingsRepository extends JpaRepository<AccountingSettings, String> {
    Optional<AccountingSettings> findByKey(String key);
}
