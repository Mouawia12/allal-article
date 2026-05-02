package com.allalarticle.backend.integration.ai.service;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Component
public class OpenAiConnectionClient {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public OpenAiConnectionClient(RestClient.Builder builder, ObjectMapper objectMapper) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        requestFactory.setReadTimeout(Duration.ofSeconds(20));
        this.restClient = builder
                .baseUrl("https://api.openai.com/v1")
                .requestFactory(requestFactory)
                .build();
        this.objectMapper = objectMapper;
    }

    public void verifyModel(String apiKey, String model) {
        try {
            restClient.get()
                    .uri("/models/{model}", model)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .retrieve()
                    .toBodilessEntity();
        } catch (HttpClientErrorException.Unauthorized e) {
            throw new AppException(ErrorCode.UNAUTHORIZED,
                    "مفتاح OpenAI غير صحيح أو منتهي الصلاحية", HttpStatus.UNAUTHORIZED);
        } catch (HttpClientErrorException.Forbidden e) {
            throw new AppException(ErrorCode.FORBIDDEN,
                    "مفتاح OpenAI لا يملك صلاحية الوصول المطلوبة", HttpStatus.FORBIDDEN);
        } catch (HttpClientErrorException.NotFound e) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "الموديل المحدد غير متاح لهذا المفتاح", HttpStatus.BAD_REQUEST);
        } catch (ResourceAccessException e) {
            throw new AppException(ErrorCode.INTERNAL_ERROR,
                    "تعذر الوصول إلى OpenAI حالياً", HttpStatus.BAD_GATEWAY);
        } catch (RestClientResponseException e) {
            throw new AppException(ErrorCode.BAD_REQUEST, openAiErrorMessage(e), HttpStatus.BAD_REQUEST);
        }
    }

    public List<OpenAiModel> listModels(String apiKey) {
        try {
            JsonNode response = restClient.get()
                    .uri("/models")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .retrieve()
                    .body(JsonNode.class);

            List<OpenAiModel> models = new ArrayList<>();
            JsonNode data = response != null ? response.path("data") : null;
            if (data != null && data.isArray()) {
                for (JsonNode item : data) {
                    String id = item.path("id").asText(null);
                    if (id == null || id.isBlank()) continue;
                    models.add(new OpenAiModel(
                            id,
                            item.path("created").isNumber() ? item.path("created").asLong() : null,
                            item.path("owned_by").asText(null)));
                }
            }
            models.sort(Comparator.comparing(OpenAiModel::id));
            return models;
        } catch (HttpClientErrorException.Unauthorized e) {
            throw new AppException(ErrorCode.UNAUTHORIZED,
                    "مفتاح OpenAI غير صحيح أو منتهي الصلاحية", HttpStatus.UNAUTHORIZED);
        } catch (HttpClientErrorException.Forbidden e) {
            throw new AppException(ErrorCode.FORBIDDEN,
                    "مفتاح OpenAI لا يملك صلاحية قراءة قائمة الموديلات", HttpStatus.FORBIDDEN);
        } catch (ResourceAccessException e) {
            throw new AppException(ErrorCode.INTERNAL_ERROR,
                    "تعذر الوصول إلى OpenAI حالياً", HttpStatus.BAD_GATEWAY);
        } catch (RestClientResponseException e) {
            throw new AppException(ErrorCode.BAD_REQUEST, openAiErrorMessage(e), HttpStatus.BAD_REQUEST);
        }
    }

    private String openAiErrorMessage(RestClientResponseException e) {
        try {
            String message = objectMapper.readTree(e.getResponseBodyAsString())
                    .path("error")
                    .path("message")
                    .asText();
            if (message != null && !message.isBlank()) return message;
        } catch (Exception ignored) {
            // Fall back to a generic message without exposing request details.
        }
        return "فشل اختبار الاتصال مع OpenAI";
    }

    public record OpenAiModel(String id, Long created, String ownedBy) {}
}
