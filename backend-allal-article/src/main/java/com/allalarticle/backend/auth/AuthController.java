package com.allalarticle.backend.auth;

import com.allalarticle.backend.auth.dto.LoginRequest;
import com.allalarticle.backend.auth.dto.LoginResponse;
import com.allalarticle.backend.auth.platform.PlatformUserDetails;
import com.allalarticle.backend.auth.platform.PlatformUserDetailsService;
import com.allalarticle.backend.auth.tenant.TenantUserDetails;
import com.allalarticle.backend.auth.tenant.TenantUserDetailsService;
import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.common.response.ApiResponse;
import com.allalarticle.backend.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class AuthController {

    private final JwtService jwtService;
    private final PlatformUserDetailsService platformUserDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbc;

    @PostMapping("/api/platform/auth/login")
    public ResponseEntity<ApiResponse<LoginResponse>> platformLogin(
            @Valid @RequestBody LoginRequest req) {

        PlatformUserDetails user;
        try {
            user = (PlatformUserDetails) platformUserDetailsService.loadUserByUsername(req.email());
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNAUTHORIZED, "Invalid credentials", HttpStatus.UNAUTHORIZED);
        }

        if (!user.isEnabled()) {
            throw new AppException(ErrorCode.UNAUTHORIZED, "Account is not active", HttpStatus.UNAUTHORIZED);
        }
        if (!passwordEncoder.matches(req.password(), user.passwordHash())) {
            throw new AppException(ErrorCode.UNAUTHORIZED, "Invalid credentials", HttpStatus.UNAUTHORIZED);
        }

        String token = jwtService.generateToken(
                user.id(), user.email(), "platform", null, user.roleCode());

        return ResponseEntity.ok(ApiResponse.ok(new LoginResponse(
                token, user.id(), user.email(), user.email(),
                user.roleCode(), "platform", null)));
    }

    @PostMapping("/api/auth/login")
    public ResponseEntity<ApiResponse<LoginResponse>> tenantLogin(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantSchema,
            @Valid @RequestBody LoginRequest req) {

        if (tenantSchema == null || tenantSchema.isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "X-Tenant-ID header is required", HttpStatus.BAD_REQUEST);
        }

        if (!TenantContext.isValidSchema(tenantSchema)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Invalid tenant identifier", HttpStatus.BAD_REQUEST);
        }

        var service = new TenantUserDetailsService(jdbc, tenantSchema);
        TenantUserDetails user;
        try {
            user = (TenantUserDetails) service.loadUserByUsername(req.email());
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNAUTHORIZED, "Invalid credentials", HttpStatus.UNAUTHORIZED);
        }

        if (!user.isEnabled()) {
            throw new AppException(ErrorCode.UNAUTHORIZED, "Account is not active", HttpStatus.UNAUTHORIZED);
        }
        if (!passwordEncoder.matches(req.password(), user.passwordHash())) {
            throw new AppException(ErrorCode.UNAUTHORIZED, "Invalid credentials", HttpStatus.UNAUTHORIZED);
        }

        String name = fetchTenantUserName(tenantSchema, user.id());
        String token = jwtService.generateToken(
                user.id(), user.email(), "tenant", tenantSchema, user.roleCode());

        return ResponseEntity.ok(ApiResponse.ok(new LoginResponse(
                token, user.id(), user.email(), name,
                user.roleCode(), "tenant", tenantSchema)));
    }

    private String fetchTenantUserName(String schema, long userId) {
        try {
            return jdbc.queryForObject(
                String.format("SELECT name FROM \"%s\".users WHERE id = ?", schema),
                String.class, userId);
        } catch (Exception e) {
            return "";
        }
    }
}
