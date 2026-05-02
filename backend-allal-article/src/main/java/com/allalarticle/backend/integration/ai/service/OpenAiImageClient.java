package com.allalarticle.backend.integration.ai.service;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class OpenAiImageClient {

    private final RestClient openAi;
    private final RestClient plainRestClient;
    private final ObjectMapper objectMapper;

    public OpenAiImageClient(RestClient.Builder builder, ObjectMapper objectMapper) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(15));
        requestFactory.setReadTimeout(Duration.ofSeconds(90));
        this.openAi = builder
                .baseUrl("https://api.openai.com/v1")
                .requestFactory(requestFactory)
                .build();
        this.plainRestClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
        this.objectMapper = objectMapper;
    }

    public GeneratedImage generate(String apiKey, String model, String prompt) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("prompt", prompt);
        body.put("size", "1024x1024");
        body.put("quality", imageQuality(model));
        body.put("n", 1);
        if (model != null && model.startsWith("dall-e")) {
            body.put("response_format", "b64_json");
        }

        try {
            JsonNode response = openAi.post()
                    .uri("/images/generations")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            return imageFromResponse(response, "لم يرجع OpenAI صورة صالحة");
        } catch (HttpClientErrorException.Unauthorized e) {
            throw new AppException(ErrorCode.UNAUTHORIZED,
                    "مفتاح OpenAI غير صحيح أو منتهي الصلاحية", HttpStatus.UNAUTHORIZED);
        } catch (HttpClientErrorException.Forbidden e) {
            throw new AppException(ErrorCode.FORBIDDEN,
                    "مفتاح OpenAI لا يملك صلاحية توليد الصور", HttpStatus.FORBIDDEN);
        } catch (ResourceAccessException e) {
            throw new AppException(ErrorCode.INTERNAL_ERROR,
                    "تعذر الوصول إلى OpenAI حالياً", HttpStatus.BAD_GATEWAY);
        } catch (RestClientResponseException e) {
            throw new AppException(ErrorCode.BAD_REQUEST, openAiErrorMessage(e), HttpStatus.BAD_REQUEST);
        }
    }

    public GeneratedImage edit(String apiKey, String model, String prompt,
                               byte[] imageBytes, String filename, String contentType) {
        String editModel = imageEditModel(model);
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("model", editModel);
        body.add("prompt", prompt);
        body.add("image", imagePart(imageBytes, filename, contentType));
        body.add("size", "1024x1024");
        body.add("quality", imageQuality(editModel));
        body.add("background", "transparent");
        body.add("n", "1");

        try {
            JsonNode response = openAi.post()
                    .uri("/images/edits")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            return imageFromResponse(response, "لم يرجع OpenAI صورة معالجة صالحة");
        } catch (HttpClientErrorException.Unauthorized e) {
            throw new AppException(ErrorCode.UNAUTHORIZED,
                    "مفتاح OpenAI غير صحيح أو منتهي الصلاحية", HttpStatus.UNAUTHORIZED);
        } catch (HttpClientErrorException.Forbidden e) {
            throw new AppException(ErrorCode.FORBIDDEN,
                    "مفتاح OpenAI لا يملك صلاحية معالجة الصور", HttpStatus.FORBIDDEN);
        } catch (ResourceAccessException e) {
            throw new AppException(ErrorCode.INTERNAL_ERROR,
                    "تعذر الوصول إلى OpenAI حالياً", HttpStatus.BAD_GATEWAY);
        } catch (RestClientResponseException e) {
            throw new AppException(ErrorCode.BAD_REQUEST, openAiErrorMessage(e), HttpStatus.BAD_REQUEST);
        }
    }

    public String imageEditModel(String model) {
        String value = model != null ? model.trim() : "";
        return value.startsWith("gpt-image") ? value : "gpt-image-1";
    }

    private String imageQuality(String model) {
        return model != null && model.startsWith("dall-e") ? "standard" : "medium";
    }

    private HttpEntity<ByteArrayResource> imagePart(byte[] bytes, String filename, String contentType) {
        String safeFilename = filename != null && !filename.isBlank() ? filename : "product-image.png";
        ByteArrayResource resource = new ByteArrayResource(bytes) {
            @Override
            public String getFilename() {
                return safeFilename;
            }
        };

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDispositionFormData("image", safeFilename);
        headers.setContentType(parseMediaType(contentType));
        return new HttpEntity<>(resource, headers);
    }

    private MediaType parseMediaType(String contentType) {
        if (contentType == null || contentType.isBlank()) return MediaType.APPLICATION_OCTET_STREAM;
        try {
            return MediaType.parseMediaType(contentType);
        } catch (Exception e) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }

    private GeneratedImage imageFromResponse(JsonNode response, String emptyMessage) {
        JsonNode item = response != null ? response.path("data").path(0) : null;
        if (item == null || item.isMissingNode()) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, emptyMessage, HttpStatus.BAD_GATEWAY);
        }

        String revisedPrompt = item.path("revised_prompt").asText(null);
        String b64 = item.path("b64_json").asText(null);
        if (b64 != null && !b64.isBlank()) {
            return new GeneratedImage(Base64.getDecoder().decode(b64), "image/png", revisedPrompt);
        }

        String url = item.path("url").asText(null);
        if (url != null && !url.isBlank()) {
            byte[] bytes = plainRestClient.get().uri(url).retrieve().body(byte[].class);
            if (bytes != null && bytes.length > 0) {
                return new GeneratedImage(bytes, "image/png", revisedPrompt);
            }
        }

        throw new AppException(ErrorCode.INTERNAL_ERROR,
                "لم يرجع OpenAI صورة قابلة للتحميل", HttpStatus.BAD_GATEWAY);
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
        return "فشل توليد الصورة عبر OpenAI";
    }

    public record GeneratedImage(byte[] bytes, String mimeType, String revisedPrompt) {}
}
