package com.allalarticle.backend.integration.whatsapp;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class WhatsAppClient {

    private final RestTemplate restTemplate;
    private final String apiUrl;
    private final String phoneNumberId;
    private final String accessToken;

    public WhatsAppClient(
            RestTemplate restTemplate,
            @Value("${whatsapp.api-url}") String apiUrl,
            @Value("${whatsapp.phone-number-id}") String phoneNumberId,
            @Value("${whatsapp.access-token}") String accessToken) {
        this.restTemplate = restTemplate;
        this.apiUrl = apiUrl;
        this.phoneNumberId = phoneNumberId;
        this.accessToken = accessToken;
    }

    public boolean sendTextMessage(String toPhone, String text) {
        String url = apiUrl + "/" + phoneNumberId + "/messages";
        Map<String, Object> body = Map.of(
                "messaging_product", "whatsapp",
                "to", toPhone,
                "type", "text",
                "text", Map.of("body", text)
        );
        return post(url, body);
    }

    public boolean sendDocumentMessage(String toPhone, String documentUrl, String filename, String caption) {
        String url = apiUrl + "/" + phoneNumberId + "/messages";
        Map<String, Object> body = Map.of(
                "messaging_product", "whatsapp",
                "to", toPhone,
                "type", "document",
                "document", Map.of("link", documentUrl, "filename", filename, "caption", caption)
        );
        return post(url, body);
    }

    private boolean post(String url, Object body) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken);
            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.error("WhatsApp API error: {}", e.getMessage());
            return false;
        }
    }
}
