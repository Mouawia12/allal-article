package com.allalarticle.backend.accounting.repository;

import com.allalarticle.backend.accounting.entity.FiscalYear;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface FiscalYearRepository extends JpaRepository<FiscalYear, Long> {
    List<FiscalYear> findAllByOrderByStartDateDesc();
    Optional<FiscalYear> findByStatus(String status);
    boolean existsByStartDateLessThanEqualAndEndDateGreaterThanEqual(LocalDate end, LocalDate start);
}
