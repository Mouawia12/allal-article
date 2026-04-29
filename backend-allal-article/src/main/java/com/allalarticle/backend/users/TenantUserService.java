package com.allalarticle.backend.users;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.common.response.PageResponse;
import com.allalarticle.backend.roles.RoleRepository;
import com.allalarticle.backend.users.dto.UserRequest;
import com.allalarticle.backend.users.dto.UserResponse;
import com.allalarticle.backend.users.entity.TenantUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TenantUserService {

    private final TenantUserRepository userRepo;
    private final RoleRepository roleRepo;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> list(String q, Pageable pageable) {
        var page = (q != null && !q.isBlank())
                ? userRepo.search(q.trim(), pageable)
                : userRepo.findByDeletedAtIsNull(pageable);
        return PageResponse.from(page.map(UserResponse::from));
    }

    @Transactional(readOnly = true)
    public UserResponse getById(Long id) {
        return userRepo.findById(id)
                .filter(u -> u.getDeletedAt() == null)
                .map(UserResponse::from)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public UserResponse create(UserRequest req) {
        if (userRepo.existsByEmail(req.email())) {
            throw new AppException(ErrorCode.CONFLICT, "Email already in use", HttpStatus.CONFLICT);
        }
        var role = roleRepo.findById(req.roleId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Role not found", HttpStatus.NOT_FOUND));

        var user = TenantUser.builder()
                .name(req.name())
                .email(req.email())
                .phone(req.phone())
                .passwordHash(passwordEncoder.encode(req.password()))
                .primaryRole(role)
                .userType(req.userType() != null ? req.userType() : "seller")
                .build();

        return UserResponse.from(userRepo.save(user));
    }

    @Transactional
    public UserResponse update(Long id, UserRequest req) {
        var user = userRepo.findById(id)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));

        var role = roleRepo.findById(req.roleId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Role not found", HttpStatus.NOT_FOUND));

        user.setName(req.name());
        user.setPhone(req.phone());
        user.setPrimaryRole(role);
        if (req.userType() != null) user.setUserType(req.userType());
        if (req.password() != null && !req.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(req.password()));
        }

        return UserResponse.from(userRepo.save(user));
    }

    @Transactional
    public UserResponse toggleStatus(Long id) {
        var user = userRepo.findById(id)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));
        user.setStatus("active".equals(user.getStatus()) ? "inactive" : "active");
        return UserResponse.from(userRepo.save(user));
    }

    @Transactional
    public UserResponse updateProfile(Long id, java.util.Map<String, String> body) {
        var user = userRepo.findById(id)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));

        if (body.containsKey("name") && body.get("name") != null && !body.get("name").isBlank())
            user.setName(body.get("name"));
        if (body.containsKey("phone"))
            user.setPhone(body.get("phone"));
        if (body.containsKey("password") && body.get("password") != null && body.get("password").length() >= 8)
            user.setPasswordHash(passwordEncoder.encode(body.get("password")));

        return UserResponse.from(userRepo.save(user));
    }

    @Transactional
    public void delete(Long id) {
        var user = userRepo.findById(id)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));
        user.setDeletedAt(java.time.OffsetDateTime.now());
        userRepo.save(user);
    }
}
