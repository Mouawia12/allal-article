package com.allalarticle.backend.accounting.repository;

import com.allalarticle.backend.accounting.entity.JournalBook;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JournalBookRepository extends JpaRepository<JournalBook, Long> {
    Optional<JournalBook> findByCode(String code);
    List<JournalBook> findByActiveTrue();
}
