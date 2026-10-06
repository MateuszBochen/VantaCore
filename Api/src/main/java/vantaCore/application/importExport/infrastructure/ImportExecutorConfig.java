package vantaCore.application.importExport.infrastructure;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/** Own bounded pool, same reasoning as AutomationEngineExecutorConfig/EventAsyncExecutorConfig -
 an import job moves real file bytes (attachment downloads/re-uploads) on top of per-row DB work,
 a heavier and more variable workload than either of those, so it shouldn't share/compete with them.
 Core size 1 (imports are an infrequent, admin-triggered action, not a high-throughput path) with
 headroom for a couple running at once. */
@Configuration
public class ImportExecutorConfig {

    @Bean(name = "importExecutor")
    public Executor importExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(1);
        executor.setMaxPoolSize(3);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("import-job-");
        executor.initialize();

        return executor;
    }
}
