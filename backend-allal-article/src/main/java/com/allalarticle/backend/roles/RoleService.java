package com.allalarticle.backend.roles;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.roles.dto.RoleResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepo;

    @Transactional(readOnly = true)
    public List<RoleResponse> listAll() {
        return roleRepo.findAll().stream().map(RoleResponse::summary).toList();
    }

    @Transactional(readOnly = true)
    public RoleResponse getById(Long id) {
        return roleRepo.findById(id)
                .map(RoleResponse::from)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Role not found", HttpStatus.NOT_FOUND));
    }
}
