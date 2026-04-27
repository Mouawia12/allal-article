package com.allalarticle.backend.accounting.repository;

import com.allalarticle.backend.accounting.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    Optional<Account> findByCode(String code);
    boolean existsByCode(String code);
    List<Account> findByDeletedAtIsNullOrderBySortOrder();
    List<Account> findByDeletedAtIsNullAndClassificationOrderBySortOrder(String classification);

    @Query("SELECT a FROM Account a WHERE a.deletedAt IS NULL AND a.postable = true ORDER BY a.sortOrder")
    List<Account> findAllPostable();

    @Query("SELECT a FROM Account a WHERE a.deletedAt IS NULL AND a.parent.id = :parentId ORDER BY a.sortOrder")
    List<Account> findByParentId(Long parentId);
}
