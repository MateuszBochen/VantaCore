package vantaCore.application.webhook.infrastructure;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/** Own bounded pool, same reasoning as AutomationEngineExecutorConfig/ImportExecutorConfig - a
 delivery attempt is a blocking outbound HTTP call to a third party (Slack/Teams/Discord/a customer
 endpoint) with its own retry/backoff, per the sub-project's own risk note that delivery "must
 never block the app itself". Sized a bit larger than importExecutor since deliveries fire on
 every matching ticket/comment event, not just an admin-triggered import. */
@Configuration
public class WebhookExecutorConfig {

    @Bean(name = "webhookDeliveryExecutor")
    public Executor webhookDeliveryExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("webhook-delivery-");
        executor.initialize();

        return executor;
    }
}
