package com.allalarticle.backend.orders;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderAutoCompleteJob {

    private final OrderService orderService;

    @Scheduled(cron = "0 0 * * * *")
    public void run() {
        log.info("Running order auto-complete job");
        orderService.autoCompleteShipped();
    }
}
