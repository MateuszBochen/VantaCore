package vantaCore.application.importExport.infrastructure.source;

import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.JdkClientHttpRequestFactory;

import java.net.http.HttpClient;
import java.time.Duration;

/** Spring's RestClient defaults to the JDK's java.net.http.HttpClient, whose own default redirect
 policy is NEVER - so a 3xx response (e.g. Jira Cloud's attachment content endpoint, which redirects
 to a signed media-host URL rather than streaming the file itself) comes back with an empty body
 instead of being transparently followed, and RestClient.body(InputStream.class) then returns null.
 Both JiraImportSource and AzureDevOpsImportSource build their RestClient with this factory instead
 of the (redirect-blind) default.

 ONE shared HttpClient for every import request, not one per call: an import makes thousands of
 requests, and each JDK HttpClient owns its own connection pool and selector thread - a fresh one
 per request meant a fresh TLS connection every time. HTTP/1.1 rather than the JDK's default HTTP/2:
 Azure DevOps' front end resets long-lived multiplexed HTTP/2 streams under load ("RST_STREAM:
 Stream cancelled"), which plain HTTP/1.1 keep-alive connections don't run into. Timeouts so a hung
 provider fails the request (and gets retried - see TransientFailureRetryInterceptor) instead of
 stalling the whole job forever. */
final class RedirectFollowingRequestFactory {

    private static final ClientHttpRequestFactory SHARED = build();

    private RedirectFollowingRequestFactory() {
    }

    static ClientHttpRequestFactory create() {
        return SHARED;
    }

    private static ClientHttpRequestFactory build() {
        HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(30))
            .build();

        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(Duration.ofMinutes(2));
        return factory;
    }
}
