package com.allalarticle.backend.integration.ai.service;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.integration.ai.dto.AiConnectionTestRequest;
import com.allalarticle.backend.integration.ai.dto.AiSettingsRequest;
import com.allalarticle.backend.tenant.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiSettingsServiceTest {

    @Mock
    private JdbcTemplate jdbc;

    @Mock
    private OpenAiConnectionClient openAiClient;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private AiSettingsService service;

    @BeforeEach
    void setUp() {
        TenantContext.set("tenant_abcdef123456");
        service = new AiSettingsService(
                jdbc,
                objectMapper,
                new SecretCodec("test-secret-with-enough-entropy"),
                openAiClient,
                "sk-env-secret-1234",
                "gpt-4o");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void getSettings_usesEnvironmentKeyWhenTenantKeyIsMissing() {
        when(jdbc.queryForObject(anyString(), eq(String.class), eq("ai.integration")))
                .thenThrow(new EmptyResultDataAccessException(1));

        var response = service.getSettings();

        assertThat(response.hasOpenAiApiKey()).isTrue();
        assertThat(response.openAiKeySource()).isEqualTo("environment");
        assertThat(response.maskedOpenAiApiKey()).endsWith("1234");
        assertThat(response.model()).isEqualTo("gpt-4o");
    }

    @Test
    void save_encryptsOpenAiKeyAndDoesNotPersistPlainSecret() {
        when(jdbc.queryForObject(anyString(), eq(String.class), eq("ai.integration")))
                .thenThrow(new EmptyResultDataAccessException(1));

        service.save(new AiSettingsRequest(
                "openai",
                "sk-test-secret-5678",
                false,
                "gpt-4o-mini",
                "dall-e-3",
                true,
                true,
                "prompt"));

        ArgumentCaptor<String> json = ArgumentCaptor.forClass(String.class);
        verify(jdbc).update(anyString(), eq("ai.integration"), json.capture(), eq(true));

        assertThat(json.getValue()).contains("openAiApiKeyEncrypted");
        assertThat(json.getValue()).contains("openAiApiKeyLast4");
        assertThat(json.getValue()).contains("5678");
        assertThat(json.getValue()).doesNotContain("sk-test-secret-5678");
    }

    @Test
    void testConnection_usesExplicitUnsavedKey() {
        when(jdbc.queryForObject(anyString(), eq(String.class), eq("ai.integration")))
                .thenThrow(new EmptyResultDataAccessException(1));

        var response = service.testConnection(new AiConnectionTestRequest(
                "openai",
                "sk-proj-live-test",
                "gpt-4o-mini"));

        verify(openAiClient).verifyModel("sk-proj-live-test", "gpt-4o-mini");
        assertThat(response.success()).isTrue();
        assertThat(response.model()).isEqualTo("gpt-4o-mini");
    }

    @Test
    void testConnection_failsWhenNoKeyExists() {
        service = new AiSettingsService(
                jdbc,
                objectMapper,
                new SecretCodec("test-secret-with-enough-entropy"),
                openAiClient,
                "",
                "gpt-4o");
        when(jdbc.queryForObject(anyString(), eq(String.class), eq("ai.integration")))
                .thenThrow(new EmptyResultDataAccessException(1));

        assertThatThrownBy(() -> service.testConnection(new AiConnectionTestRequest("openai", "", "gpt-4o")))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("مفتاح OpenAI غير مضبوط");
        verifyNoInteractions(openAiClient);
    }
}
