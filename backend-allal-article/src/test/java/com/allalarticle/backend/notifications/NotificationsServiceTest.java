package com.allalarticle.backend.notifications;

import com.allalarticle.backend.tenant.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationsServiceTest {

    @Mock JdbcTemplate jdbc;

    private NotificationsService service;

    @BeforeEach
    void setUp() {
        TenantContext.set("tenant_abcdef123456");
        service = new NotificationsService(jdbc, new ObjectMapper());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void publishToActiveUsers_deliversToActiveUsersAndActor() {
        when(jdbc.queryForList(contains(".users"), eq(Long.class)))
                .thenReturn(List.of(2L, 3L));
        stubNotificationInsert(99L);

        Long notificationId = service.publishToActiveUsers(request(1L));

        assertThat(notificationId).isEqualTo(99L);
        verify(jdbc).update(contains("notification_recipients"), eq(99L), eq(2L), anyString());
        verify(jdbc).update(contains("notification_recipients"), eq(99L), eq(3L), anyString());
        verify(jdbc).update(contains("notification_recipients"), eq(99L), eq(1L), contains("منفذ العملية"));
        verify(jdbc, times(3)).update(contains("notification_recipients"), eq(99L), anyLong(), anyString());
    }

    @Test
    void publishToUsers_addsActorEvenWhenResolverDidNotReturnActor() {
        stubNotificationInsert(100L);

        Long notificationId = service.publishToUsers(request(7L), List.of(4L, 5L));

        assertThat(notificationId).isEqualTo(100L);
        verify(jdbc).update(contains("notification_recipients"), eq(100L), eq(4L), anyString());
        verify(jdbc).update(contains("notification_recipients"), eq(100L), eq(5L), anyString());
        verify(jdbc).update(contains("notification_recipients"), eq(100L), eq(7L), contains("منفذ العملية"));
        verify(jdbc, times(3)).update(contains("notification_recipients"), eq(100L), anyLong(), anyString());
    }

    @Test
    void markRead_movesDeliveredOrNewNotificationToRead() {
        service.markRead(99L, 7L);

        verify(jdbc).update(contains("state IN ('new', 'delivered')"), eq(99L), eq(7L));
    }

    private NotificationsService.NotificationRequest request(Long actorUserId) {
        String reason = "مستلم ضمن مستخدمي المؤسسة، ولا يتم استثناء منفذ العملية.";
        return new NotificationsService.NotificationRequest(
                "orders",
                "info",
                "طلبية جديدة",
                "تم إنشاء طلبية جديدة",
                "order",
                55L,
                actorUserId,
                "order_created",
                "/orders/55",
                reason,
                reason,
                Map.of("orderId", 55L),
                null,
                "orders:order_created");
    }

    private void stubNotificationInsert(Long id) {
        when(jdbc.queryForObject(
                contains("INSERT INTO"),
                eq(Long.class),
                any(), any(), any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(), any(), any()
        )).thenReturn(id);
    }
}
