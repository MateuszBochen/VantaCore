package vantaCore.application.shared.infrastructure.bus;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/** Dedicated pool for AsyncEvent-routed events (EventHandlerMiddleware) - deliberately not Spring
 Boot's default "applicationTaskExecutor" auto-configured bean, so this stays isolated from
 whatever else might reach for @Async/a generic executor later; thread names are prefixed to make
 it obvious in logs/thread dumps what's running on them. Small and bounded - today's only user is
 documentation reindexing (a handful of Ollama calls per save), not a general-purpose work queue. */
@Configuration
public class EventAsyncExecutorConfig {

    @Bean(name = "eventAsyncExecutor")
    public Executor eventAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("event-async-");
        executor.initialize();

        return executor;
    }
}
