package com.allalarticle.backend.config;

import com.allalarticle.backend.auth.JwtAuthFilter;
import com.allalarticle.backend.auth.JwtService;
import com.allalarticle.backend.platform.PlatformController;
import com.allalarticle.backend.platform.PlatformService;
import com.allalarticle.backend.settings.SettingsController;
import com.allalarticle.backend.settings.SettingsService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {SettingsController.class, PlatformController.class})
@Import({SecurityConfig.class, JwtAuthFilter.class})
@ImportAutoConfiguration(exclude = UserDetailsServiceAutoConfiguration.class)
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private SettingsService settingsService;

    @MockitoBean
    private PlatformService platformService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void tenantEndpointsRejectPlatformTokens() throws Exception {
        mockToken("platform-token", claims("platform", null, "owner"));

        mockMvc.perform(get("/api/settings/company")
                        .header("Authorization", "Bearer platform-token"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(settingsService);
    }

    @Test
    void platformEndpointsRejectTenantTokens() throws Exception {
        mockToken("tenant-token", claims("tenant", "tenant_abcdef123456", "owner"));

        mockMvc.perform(get("/api/platform/stats")
                        .header("Authorization", "Bearer tenant-token"))
                .andExpect(status().isForbidden());

        verifyNoInteractions(platformService);
    }

    @Test
    void tenantEndpointsAcceptTenantTokens() throws Exception {
        mockToken("tenant-token", claims("tenant", "tenant_abcdef123456", "owner"));
        when(settingsService.getCompanyProfile()).thenReturn(Map.of("companyName", "Allal"));

        mockMvc.perform(get("/api/settings/company")
                        .header("Authorization", "Bearer tenant-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.companyName").value("Allal"));
    }

    @Test
    void platformEndpointsAcceptPlatformTokens() throws Exception {
        mockToken("platform-token", claims("platform", null, "owner"));
        when(platformService.getStats()).thenReturn(Map.of("totalTenants", 0));

        mockMvc.perform(get("/api/platform/stats")
                        .header("Authorization", "Bearer platform-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalTenants").value(0));
    }

    private void mockToken(String token, Claims claims) {
        when(jwtService.isValid(token)).thenReturn(true);
        when(jwtService.parseToken(token)).thenReturn(claims);
    }

    private Claims claims(String type, String schema, String roleCode) {
        var builder = Jwts.claims()
                .subject("user@example.com")
                .add("userId", 1L)
                .add("type", type)
                .add("roleCode", roleCode);
        if (schema != null) {
            builder.add("schema", schema);
        }
        return builder.build();
    }
}
