package vantaCore.application.importExport.infrastructure.source;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;

import java.io.IOException;
import java.time.Duration;
import java.util.Set;

/** Retries a provider request that failed for a TRANSIENT reason - a connection-level I/O error
 (reset/cancelled stream, dropped connection, timeout) or 429/502/503/504 - up to MAX_ATTEMPTS
 times, waiting the provider's Retry-After when it sends one (Azure DevOps and Jira both do when
 throttling, capped at MAX_WAIT) and exponential backoff otherwise. Every import request is a read
 (the POSTs are WIQL/batch/search queries), so re-sending is always safe. A single flaky request
 used to fail a whole multi-thousand-item import job. */
final class TransientFailureRetryInterceptor implements ClientHttpRequestInterceptor {

    static final TransientFailureRetryInterceptor INSTANCE = new TransientFailureRetryInterceptor();

    private static final Logger log = LoggerFactory.getLogger(TransientFailureRetryInterceptor.class);
    private static final int MAX_ATTEMPTS = 4;
    private static final Duration MAX_WAIT = Duration.ofSeconds(60);
    private static final Set<Integer> RETRYABLE_STATUSES = Set.of(429, 502, 503, 504);

    private TransientFailureRetryInterceptor() {
    }

    @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution) throws IOException {
        for (int attempt = 1; ; attempt++) {
            ClientHttpResponse response;
            try {
                // Calling execute() again re-sends through a fresh underlying request - this is the
                // last (only) interceptor, so the execution goes straight to the request factory.
                response = execution.execute(request, body);
            } catch (IOException exception) {
                if (attempt >= MAX_ATTEMPTS) {
                    throw exception;
                }
                Duration wait = backoff(attempt);
                log.warn("{} {} failed ({}), retry {}/{} in {}s",
                    request.getMethod(), request.getURI(), exception.getMessage(), attempt, MAX_ATTEMPTS - 1, wait.toSeconds());
                sleep(wait);
                continue;
            }

            int status = response.getStatusCode().value();
            if (attempt >= MAX_ATTEMPTS || !RETRYABLE_STATUSES.contains(status)) {
                return response;
            }

            Duration wait = retryAfter(response);
            if (wait == null) {
                wait = backoff(attempt);
            }
            response.close();
            log.warn("{} {} answered {}, retry {}/{} in {}s",
                request.getMethod(), request.getURI(), status, attempt, MAX_ATTEMPTS - 1, wait.toSeconds());
            sleep(wait);
        }
    }

    // 2s, 4s, 8s
    private Duration backoff(int attempt) {
        return Duration.ofSeconds(1L << attempt);
    }

    // Only the delay-seconds form - both providers send that; an HTTP-date form falls back to backoff.
    private Duration retryAfter(ClientHttpResponse response) {
        String value = response.getHeaders().getFirst("Retry-After");
        if (value == null) {
            return null;
        }
        try {
            Duration wait = Duration.ofSeconds(Math.max(1, Long.parseLong(value.trim())));
            return wait.compareTo(MAX_WAIT) > 0 ? MAX_WAIT : wait;
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private void sleep(Duration wait) throws IOException {
        try {
            Thread.sleep(wait.toMillis());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IOException("Interrupted while waiting to retry", exception);
        }
    }
}
