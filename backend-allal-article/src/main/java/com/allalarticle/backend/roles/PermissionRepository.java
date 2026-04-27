package com.allalarticle.backend.roles;

import com.allalarticle.backend.roles.entity.Permission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PermissionRepository extends JpaRepository<Permission, Long> {

    Page<Permission> findByModuleIgnoreCase(String module, Pageable pageable);
}
