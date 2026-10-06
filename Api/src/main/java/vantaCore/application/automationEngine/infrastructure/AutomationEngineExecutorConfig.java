package vantaCore.application.automationEngine.infrastructure;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/** Separate from documentation.search's eventAsyncExecutor (EventAsyncExecutorConfig) - rule
 execution can chain into several more command dispatches per action (each themselves doing DB
 work, possibly more automation), a heavier and more variable workload than embedding a
 documentation save's chunks, so it gets its own bounded pool rather than sharing/competing with
 that one. */
@Configuration
public class AutomationEngineExecutorConfig {

    @Bean(name = "automationEngineExecutor")
    public Executor automationEngineExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("automation-engine-");
        executor.initialize();

        return executor;
    }
}
