package com.allalarticle.backend.returns;

import com.allalarticle.backend.returns.entity.Return;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReturnRepository extends JpaRepository<Return, Long> {

    Page<Return> findByStatus(String status, Pageable pageable);

    Page<Return> findByCustomerId(Long customerId, Pageable pageable);

    Page<Return> findAll(Pageable pageable);
}
