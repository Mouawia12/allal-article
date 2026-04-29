package com.allalarticle.backend.settings;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.tenant.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SettingsServiceTest {

    @Mock
    private JdbcTemplate jdbc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private SettingsService service;

    @BeforeEach
    void setUp() {
        TenantContext.set("tenant_abcdef123456");
        service = new SettingsService(jdbc, objectMapper);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void getCompanyProfile_returnsEmptyMapWhenProfileIsMissing() {
        when(jdbc.queryForObject(anyString(), eq(String.class), eq("company.profile")))
                .thenThrow(new EmptyResultDataAccessException(1));

        assertThat(service.getCompanyProfile()).isEmpty();
    }

    @Test
    void getCompanyProfile_throwsWhenStorageReadFails() {
        when(jdbc.queryForObject(anyString(), eq(String.class), eq("company.profile")))
                .thenThrow(new DataAccessResourceFailureException("database unavailable"));

        assertThatThrownBy(() -> service.getCompanyProfile())
                .isInstanceOf(AppException.class)
                .hasMessageContaining("تعذر تحميل ملف الشركة");
    }

    @Test
    void getCompanyProfile_decodesSavedJson() {
        when(jdbc.queryForObject(anyString(), eq(String.class), eq("company.profile")))
                .thenReturn("{\"name\":\"Allal\",\"phone\":\"0550\"}");

        assertThat(service.getCompanyProfile())
                .containsExactlyInAnyOrderEntriesOf(Map.of(
                        "name", "Allal",
                        "phone", "0550"));
    }
}
