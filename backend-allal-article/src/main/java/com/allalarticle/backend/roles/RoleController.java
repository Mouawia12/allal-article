package com.allalarticle.backend.roles;

import com.allalarticle.backend.common.response.ApiResponse;
import com.allalarticle.backend.roles.dto.PermissionResponse;
import com.allalarticle.backend.roles.dto.RoleResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;
    private final PermissionRepository permissionRepo;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoleResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(roleService.listAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoleResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(roleService.getById(id)));
    }

    @GetMapping("/permissions")
    public ResponseEntity<ApiResponse<List<PermissionResponse>>> permissions() {
        var result = permissionRepo.findAll().stream()
                .map(PermissionResponse::from).toList();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
