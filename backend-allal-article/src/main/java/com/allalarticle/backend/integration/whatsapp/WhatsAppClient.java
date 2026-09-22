package com.allalarticle.backend.integration.whatsapp;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Component
public class WhatsAppClient {

    /** Total attempts for transient failures (server errors / network). 4xx is never retried. */
    private static final int MAX_ATTEMPTS = 3;
    /** Fixed backoff between retry attempts. Kept short to avoid holding callers for long. */
    private static final long RETRY_DELAY_MS = 400L;

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

    /**
     * POSTs to the WhatsApp Graph API. Returns {@code true} only on a 2xx response.
     * Transient failures (5xx, network) are retried up to {@link #MAX_ATTEMPTS} times;
     * client errors (4xx — bad token, malformed/rejected message) are not retried since
     * they will not succeed on a repeat. Distinct failure modes are logged separately so
     * operators can tell an auth problem from an outage from a rejected recipient.
     */
    private boolean post(String url, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);
        HttpEntity<Object> request = new HttpEntity<>(body, headers);

        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                ResponseEntity<Map> response = restTemplate.exchange(
                        url, HttpMethod.POST, request, Map.class);
                return response.getStatusCode().is2xxSuccessful();
            } catch (HttpClientErrorException e) {
                // 4xx — permanent for this request (invalid token, bad recipient, malformed body).
                if (e.getStatusCode() == HttpStatus.UNAUTHORIZED || e.getStatusCode() == HttpStatus.FORBIDDEN) {
                    log.error("WhatsApp auth failure ({}). Check whatsapp.access-token. Body: {}",
                            e.getStatusCode(), e.getResponseBodyAsString());
                } else {
                    log.error("WhatsApp rejected the request ({}). Body: {}",
                            e.getStatusCode(), e.getResponseBodyAsString());
                }
                return false;
            } catch (HttpServerErrorException e) {
                // 5xx — transient on the provider side; worth retrying.
                log.warn("WhatsApp API server error ({}) on attempt {}/{}. Body: {}",
                        e.getStatusCode(), attempt, MAX_ATTEMPTS, e.getResponseBodyAsString());
            } catch (ResourceAccessException e) {
                // Connection/timeout — transient; worth retrying.
                log.warn("WhatsApp API connection error on attempt {}/{}: {}",
                        attempt, MAX_ATTEMPTS, e.getMessage());
            } catch (Exception e) {
                log.error("Unexpected WhatsApp API error: {}", e.getMessage(), e);
                return false;
            }

            if (attempt < MAX_ATTEMPTS && !sleepBeforeRetry()) {
                break;
            }
        }
        log.error("WhatsApp message failed after {} attempts: {}", MAX_ATTEMPTS, url);
        return false;
    }

    /** Sleeps between retries; returns false if the thread is interrupted (abort retries). */
    private boolean sleepBeforeRetry() {
        try {
            Thread.sleep(RETRY_DELAY_MS);
            return true;
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            return false;
        }
    }
}
