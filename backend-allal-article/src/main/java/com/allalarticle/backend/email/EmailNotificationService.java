package com.allalarticle.backend.email;

import com.allalarticle.backend.products.entity.Product;
import com.allalarticle.backend.tenant.TenantContext;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.UnsupportedEncodingException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailNotificationService {

    public record EmailDeliveryResult(int sentCount, int totalCount, List<String> failedRecipients) {
        public boolean successful() {
            return failedRecipients == null || failedRecipients.isEmpty();
        }
    }

    private final JavaMailSender mailSender;
    private final EmailSettingsService settingsService;
    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;
    private final PlatformTransactionManager transactionManager;

    @Value("${app.mail.from-address:no-reply@souftech.com}")
    private String fromAddress;

    @Value("${app.mail.from-name:ALLAL-ARTICLE}")
    private String fromName;

    @Value("${app.mail.app-url:http://localhost:3000}")
    private String appUrl;

    // ── Public event APIs ────────────────────────────────────────────────────

    public void onProductCreated(Product product, String actorName) {
        dispatch("product.created",
                e -> e.isProductCreated(),
                "صنف جديد: " + safeName(product),
                schema -> EmailTemplates.productCreated(product, actorName, appUrl),
                Map.of(
                        "productId", product.getId(),
                        "sku", safeName(product.getSku()),
                        "name", safeName(product.getName())
                ),
                null, null);
    }

    public void onProductPriceChanged(Product product, BigDecimal previousPrice,
                                      BigDecimal newPrice, String actorName) {
        dispatch("product.price_changed",
                e -> e.isProductPriceChanged(),
                "تعديل سعر: " + safeName(product),
                schema -> EmailTemplates.productPriceChanged(product, previousPrice, newPrice, actorName, appUrl),
                Map.of(
                        "productId", product.getId(),
                        "previousPrice", previousPrice != null ? previousPrice : BigDecimal.ZERO,
                        "newPrice", newPrice != null ? newPrice : BigDecimal.ZERO
                ),
                null, null);
    }

    public void onProductLowStock(Product product, BigDecimal currentQty) {
        dispatch("product.low_stock",
                e -> e.isProductLowStock(),
                "تنبيه مخزون منخفض: " + safeName(product),
                schema -> EmailTemplates.productLowStock(product, currentQty, appUrl),
                Map.of(
                        "productId", product.getId(),
                        "currentQty", currentQty != null ? currentQty : BigDecimal.ZERO
                ),
                null, null);
    }

    /**
     * Bulk import summary. If number of rows >= threshold, attaches a CSV listing every row.
     */
    public void onBulkImportCompleted(int created, int updated, int failed,
                                      List<String[]> csvRows, List<String> sampleLines,
                                      String actorName) {
        EmailNotificationSettings settings = settingsService.load();
        int totalRows = created + updated + failed;
        boolean attach = totalRows >= settings.getBulkAttachThresholdRows();

        final byte[] attachment;
        final String attachmentName;
        if (attach && csvRows != null && !csvRows.isEmpty()) {
            attachment = buildCsv(csvRows);
            attachmentName = "products-import-" + System.currentTimeMillis() + ".csv";
        } else {
            attachment = null;
            attachmentName = null;
        }
        final boolean attachmentIncluded = attachment != null;

        dispatch("bulk_import.completed",
                e -> e.isBulkImportCompleted(),
                "ملخص استيراد الأصناف — " + totalRows + " صنف",
                schema -> EmailTemplates.bulkImportSummary(created, updated, failed,
                        sampleLines, actorName, appUrl, attachmentIncluded),
                Map.of(
                        "created", created,
                        "updated", updated,
                        "failed", failed
                ),
                attachment, attachmentName);
    }

    // ── Internal dispatch ────────────────────────────────────────────────────

    private void dispatch(String eventCode,
                          java.util.function.Predicate<EmailNotificationSettings.Events> eventEnabled,
                          String subject,
                          java.util.function.Function<String, String> bodyBuilder,
                          Map<String, Object> payload,
                          byte[] attachment,
                          String attachmentName) {
        String schema = TenantContext.get();
        if (!TenantContext.isValidSchema(schema)) {
            log.warn("Skip email dispatch [{}]: no tenant context", eventCode);
            return;
        }

        EmailNotificationSettings settings;
        try {
            settings = settingsService.loadForSchema(schema);
        } catch (Exception ex) {
            log.warn("Skip email dispatch [{}]: cannot load settings: {}", eventCode, ex.getMessage());
            return;
        }

        if (!settings.isEnabled() || !eventEnabled.test(settings.getEvents())) return;

        List<String> recipients = settingsService.resolveRecipients(settings, schema);
        if (recipients.isEmpty()) {
            log.debug("Skip email dispatch [{}]: no recipients configured", eventCode);
            return;
        }

        String html = bodyBuilder.apply(schema);
        Long outboxId = persistOutbox(schema, eventCode, subject, recipients, html, payload);
        sendAsync(schema, outboxId, subject, recipients, html, attachment, attachmentName);
    }

    public Long persistOutbox(String schema, String eventCode, String subject,
                              List<String> recipients, String html, Map<String, Object> payload) {
        if (!TenantContext.isValidSchema(schema) || !hasOutboxTable(schema)) {
            log.warn("Skip email outbox insert [{}]: email_outbox table is not available for schema {}", eventCode, schema);
            return null;
        }

        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        try {
            return tx.execute(status -> jdbc.queryForObject(String.format("""
                            INSERT INTO "%s".email_outbox
                                (event_code, subject, recipients_json, body_html, payload_json, status)
                            VALUES (?, ?, ?::jsonb, ?, ?::jsonb, 'pending')
                            RETURNING id
                            """, schema), Long.class,
                    eventCode,
                    subject,
                    toJson(recipients),
                    html,
                    toJson(payload != null ? payload : Map.of())));
        } catch (Exception e) {
            log.error("Cannot insert into email_outbox: {}", e.getMessage());
            return null;
        }
    }

    public boolean hasOutboxTable(String schema) {
        if (!TenantContext.isValidSchema(schema)) return false;
        try {
            Boolean exists = jdbc.queryForObject("""
                    SELECT EXISTS (
                        SELECT 1
                        FROM information_schema.tables
                        WHERE table_schema = ?
                          AND table_name = 'email_outbox'
                    )
                    """, Boolean.class, schema);
            return Boolean.TRUE.equals(exists);
        } catch (Exception e) {
            log.warn("Cannot check email_outbox table for schema {}: {}", schema, e.getMessage());
            return false;
        }
    }

    @Async
    public void sendAsync(String schema, Long outboxId, String subject,
                          List<String> recipients, String html,
                          byte[] attachment, String attachmentName) {
        sendNow(schema, outboxId, subject, recipients, html, attachment, attachmentName);
    }

    public EmailDeliveryResult sendNow(String schema, Long outboxId, String subject,
                                       List<String> recipients, String html,
                                       byte[] attachment, String attachmentName) {
        int total = recipients != null ? recipients.size() : 0;
        if (total == 0) {
            markSent(schema, outboxId, false, "No recipients configured");
            return new EmailDeliveryResult(0, 0, List.of());
        }

        List<String> failed = new ArrayList<>();
        int sent = 0;
        for (String recipient : recipients) {
            try {
                sendOne(recipient, subject, html, attachment, attachmentName);
                sent++;
            } catch (MessagingException | UnsupportedEncodingException | RuntimeException e) {
                failed.add(recipient + ": " + e.getMessage());
                log.error("Email send failed [{}] to {}: {}", subject, recipient, e.getMessage());
            }
        }

        if (failed.isEmpty()) {
            markSent(schema, outboxId, true, null);
            log.info("Email sent [{}] to {} recipients", subject, sent);
        } else {
            String error = "Sent " + sent + " of " + total + ". Failed: " + String.join(" | ", failed);
            markSent(schema, outboxId, false, error);
            log.warn("Email partially failed [{}]: {}", subject, error);
        }

        return new EmailDeliveryResult(sent, total, failed);
    }

    private void sendOne(String recipient, String subject, String html,
                         byte[] attachment, String attachmentName)
            throws MessagingException, UnsupportedEncodingException {
        if (recipient == null || recipient.isBlank()) {
            throw new MessagingException("blank recipient");
        }

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message,
                attachment != null,
                StandardCharsets.UTF_8.name());
        helper.setFrom(new InternetAddress(fromAddress, fromName, StandardCharsets.UTF_8.name()));
        helper.setTo(recipient.trim());
        helper.setSubject(subject);
        helper.setText(html, true);
        if (attachment != null && attachmentName != null) {
            helper.addAttachment(attachmentName,
                    new org.springframework.core.io.ByteArrayResource(attachment));
        }
        mailSender.send(message);
    }

    private void markSent(String schema, Long outboxId, boolean ok, String error) {
        if (outboxId == null) return;
        try {
            if (ok) {
                jdbc.update(String.format("""
                        UPDATE "%s".email_outbox
                        SET status = 'sent', sent_at = ?, attempts = attempts + 1
                        WHERE id = ?
                        """, schema), OffsetDateTime.now(), outboxId);
            } else {
                jdbc.update(String.format("""
                        UPDATE "%s".email_outbox
                        SET status = 'failed', error_message = ?, attempts = attempts + 1
                        WHERE id = ?
                        """, schema), error, outboxId);
            }
        } catch (Exception ex) {
            log.warn("Cannot update email_outbox status: {}", ex.getMessage());
        }
    }

    private byte[] buildCsv(List<String[]> rows) {
        StringBuilder sb = new StringBuilder();
        sb.append('﻿'); // BOM so Excel opens UTF-8 correctly
        for (String[] row : rows) {
            for (int i = 0; i < row.length; i++) {
                if (i > 0) sb.append(',');
                sb.append(csvEscape(row[i]));
            }
            sb.append('\n');
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String csvEscape(String v) {
        if (v == null) return "";
        boolean needsQuotes = v.contains(",") || v.contains("\"") || v.contains("\n") || v.contains("\r");
        String s = v.replace("\"", "\"\"");
        return needsQuotes ? "\"" + s + "\"" : s;
    }

    private String toJson(Object v) {
        try {
            return objectMapper.writeValueAsString(v);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    private String safeName(Product p) {
        return p != null && p.getName() != null ? p.getName() : "—";
    }

    private String safeName(String s) {
        return s != null ? s : "—";
    }
}
