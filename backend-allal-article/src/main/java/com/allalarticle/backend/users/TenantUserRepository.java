package com.allalarticle.backend.users;

import com.allalarticle.backend.users.entity.TenantUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface TenantUserRepository extends JpaRepository<TenantUser, Long> {

    boolean existsByEmail(String email);

    Page<TenantUser> findByDeletedAtIsNull(Pageable pageable);

    @Query("""
        SELECT u FROM TenantUser u
        WHERE u.deletedAt IS NULL
        AND (LOWER(u.name) LIKE LOWER(CONCAT('%', :q, '%'))
          OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')))
        """)
    Page<TenantUser> search(String q, Pageable pageable);
}
