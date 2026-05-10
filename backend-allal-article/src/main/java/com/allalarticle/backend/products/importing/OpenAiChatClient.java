package com.allalarticle.backend.products.importing;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Calls OpenAI /v1/chat/completions for product extraction. Supports text-only
 * input and vision (image) input. Always requests JSON-formatted output.
 */
@Component
public class OpenAiChatClient {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public OpenAiChatClient(RestClient.Builder builder, ObjectMapper objectMapper) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(15));
        requestFactory.setReadTimeout(Duration.ofSeconds(180));
        this.restClient = builder
                .baseUrl("https://api.openai.com/v1")
                .requestFactory(requestFactory)
                .build();
        this.objectMapper = objectMapper;
    }

    /** Run a chat completion. Returns the message content (expected to be JSON text). */
    public String complete(String apiKey, String model, String systemPrompt, String userText, String imageDataUrl) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("response_format", Map.of("type", "json_object"));
        // Note: do not set "temperature" — GPT-5 and o-series reasoning models
        // reject any value other than the default. JSON mode + the system prompt
        // already give us deterministic-enough output.

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));

        if (imageDataUrl != null && !imageDataUrl.isBlank()) {
            List<Map<String, Object>> parts = new ArrayList<>();
            parts.add(Map.of("type", "text", "text", userText));
            parts.add(Map.of("type", "image_url", "image_url", Map.of("url", imageDataUrl)));
            messages.add(Map.of("role", "user", "content", parts));
        } else {
            messages.add(Map.of("role", "user", "content", userText));
        }
        body.put("messages", messages);

        try {
            JsonNode response = restClient.post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            if (response == null) {
                throw new AppException(ErrorCode.INTERNAL_ERROR,
                        "استجابة فارغة من OpenAI", HttpStatus.BAD_GATEWAY);
            }
            JsonNode choices = response.path("choices");
            if (!choices.isArray() || choices.isEmpty()) {
                throw new AppException(ErrorCode.INTERNAL_ERROR,
                        "OpenAI لم يُرجع أي خيارات", HttpStatus.BAD_GATEWAY);
            }
            String content = choices.get(0).path("message").path("content").asText("");
            if (content.isBlank()) {
                throw new AppException(ErrorCode.INTERNAL_ERROR,
                        "محتوى استجابة OpenAI فارغ", HttpStatus.BAD_GATEWAY);
            }
            return content;
        } catch (HttpClientErrorException.Unauthorized e) {
            throw new AppException(ErrorCode.UNAUTHORIZED,
                    "مفتاح OpenAI غير صحيح", HttpStatus.UNAUTHORIZED);
        } catch (HttpClientErrorException.TooManyRequests e) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "تجاوزت الحصة على OpenAI، حاول لاحقاً", HttpStatus.TOO_MANY_REQUESTS);
        } catch (ResourceAccessException e) {
            throw new AppException(ErrorCode.INTERNAL_ERROR,
                    "تعذر الوصول إلى OpenAI", HttpStatus.BAD_GATEWAY);
        } catch (RestClientResponseException e) {
            throw new AppException(ErrorCode.BAD_REQUEST, openAiErrorMessage(e), HttpStatus.BAD_REQUEST);
        }
    }

    private String openAiErrorMessage(RestClientResponseException e) {
        try {
            String message = objectMapper.readTree(e.getResponseBodyAsString())
                    .path("error").path("message").asText();
            if (message != null && !message.isBlank()) return message;
        } catch (Exception ignored) {
            // fall through
        }
        return "فشل الاتصال مع OpenAI";
    }
}
