package com.allalarticle.backend.orders;

import com.allalarticle.backend.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderAutoCompleteJob {

    private final OrderService orderService;
    private final JdbcTemplate jdbc;

    @Scheduled(cron = "0 0 * * * *")
    public void run() {
        log.info("Running order auto-complete job for all tenants");
        List<String> schemas = jdbc.queryForList(
                "SELECT schema_name FROM platform.tenants WHERE status NOT IN ('suspended', 'cancelled')",
                String.class);
        for (String schema : schemas) {
            try {
                TenantContext.set(schema);
                orderService.autoCompleteShipped();
            } catch (Exception e) {
                log.error("Auto-complete failed for schema {}: {}", schema, e.getMessage());
            } finally {
                TenantContext.clear();
            }
        }
    }
}
