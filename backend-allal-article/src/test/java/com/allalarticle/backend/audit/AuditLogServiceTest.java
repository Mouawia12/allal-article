package com.allalarticle.backend.audit;

import com.allalarticle.backend.notifications.NotificationsService;
import com.allalarticle.backend.tenant.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {

    @Mock JdbcTemplate jdbc;
    @Mock NotificationsService notificationsService;

    private AuditLogService service;

    @BeforeEach
    void setUp() {
        TenantContext.set("tenant_abcdef123456");
        service = new AuditLogService(jdbc, new ObjectMapper(), notificationsService);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void log_publishesInAppNotificationForAuditEvent() {
        when(jdbc.update(contains("audit_logs"), any(), any(), any(), any(), any()))
                .thenReturn(1);

        service.log(7L, "order", 55L, "order_created",
                "إنشاء طلبية", "ORD-55", "إدارة",
                Map.of("orderNumber", "ORD-55"));

        ArgumentCaptor<NotificationsService.NotificationRequest> captor =
                ArgumentCaptor.forClass(NotificationsService.NotificationRequest.class);
        verify(notificationsService).publishToActiveUsers(captor.capture());

        var request = captor.getValue();
        assertThat(request.actorUserId()).isEqualTo(7L);
        assertThat(request.category()).isEqualTo("orders");
        assertThat(request.sourceEventCode()).isEqualTo("order_created");
        assertThat(request.actionUrl()).isEqualTo("/orders/55");
        assertThat(request.recipientReason()).contains("منفذ العملية");
    }
}
