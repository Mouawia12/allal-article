package com.allalarticle.backend.email;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.Message;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.SimpleTransactionStatus;

import java.util.List;
import java.util.Map;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class EmailNotificationServiceTest {

    private final JavaMailSender mailSender = mock(JavaMailSender.class);
    private final EmailSettingsService settingsService = mock(EmailSettingsService.class);
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final PlatformTransactionManager transactionManager = mock(PlatformTransactionManager.class);
    private final EmailNotificationService service = new EmailNotificationService(
            mailSender, settingsService, jdbc, objectMapper, transactionManager);

    @Test
    void persistOutbox_returnsNullWhenOutboxTableMissing() {
        when(jdbc.queryForObject(contains("information_schema.tables"), eq(Boolean.class),
                eq("tenant_abcdef123456"))).thenReturn(false);

        Long id = service.persistOutbox("tenant_abcdef123456", "product.price_changed",
                "subject", List.of("admin@example.com"), "<p>body</p>", Map.of("ok", true));

        assertThat(id).isNull();
        verify(transactionManager, never()).getTransaction(any());
        verify(jdbc, never()).queryForObject(contains("INSERT INTO"), eq(Long.class),
                any(), any(), any(), any(), any());
    }

    @Test
    void persistOutbox_isolatesInsertFailure() {
        TransactionStatus status = new SimpleTransactionStatus();
        when(jdbc.queryForObject(contains("information_schema.tables"), eq(Boolean.class),
                eq("tenant_abcdef123456"))).thenReturn(true);
        when(transactionManager.getTransaction(any())).thenReturn(status);
        when(jdbc.queryForObject(contains("INSERT INTO"), eq(Long.class),
                any(), any(), any(), any(), any()))
                .thenThrow(new DataAccessResourceFailureException("broken outbox"));

        Long id = service.persistOutbox("tenant_abcdef123456", "product.price_changed",
                "subject", List.of("admin@example.com"), "<p>body</p>", Map.of("ok", true));

        assertThat(id).isNull();
        verify(transactionManager).rollback(status);
        verify(transactionManager, never()).commit(any());
    }

    @Test
    void sendNow_sendsOneMessagePerRecipient() throws Exception {
        when(mailSender.createMimeMessage()).thenAnswer(invocation ->
                new MimeMessage(Session.getInstance(new Properties())));

        var result = service.sendNow("tenant_abcdef123456", null, "subject",
                List.of("first@example.com", "second@example.com"),
                "<p>body</p>", null, null);

        assertThat(result.sentCount()).isEqualTo(2);
        assertThat(result.failedRecipients()).isEmpty();

        var captor = org.mockito.ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender, times(2)).send(captor.capture());

        List<String> toAddresses = captor.getAllValues().stream()
                .map(message -> {
                    try {
                        return ((InternetAddress) message.getRecipients(Message.RecipientType.TO)[0]).getAddress();
                    } catch (Exception e) {
                        throw new AssertionError(e);
                    }
                })
                .toList();
        assertThat(toAddresses).containsExactly("first@example.com", "second@example.com");
        assertThat(captor.getAllValues())
                .allSatisfy(message -> assertThat(message.getRecipients(Message.RecipientType.BCC)).isNull());
    }
}
