package com.allalarticle.backend.auth;

import com.allalarticle.backend.auth.dto.LoginRequest;
import com.allalarticle.backend.auth.platform.PlatformUserDetailsService;
import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private PlatformUserDetailsService platformUserDetailsService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JdbcTemplate jdbc;

    private AuthController controller;

    @BeforeEach
    void setUp() {
        controller = new AuthController(jwtService, platformUserDetailsService, passwordEncoder, jdbc);
    }

    @Test
    void tenantLogin_withoutTenantHeaderReturnsBadRequest() {
        assertThatThrownBy(() -> controller.tenantLogin(
                null,
                new LoginRequest("user@example.com", "password")))
                .isInstanceOfSatisfying(AppException.class, exception -> {
                    assertThat(exception.getCode()).isEqualTo(ErrorCode.BAD_REQUEST);
                    assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(exception.getMessage()).contains("X-Tenant-ID");
                });
    }
}
