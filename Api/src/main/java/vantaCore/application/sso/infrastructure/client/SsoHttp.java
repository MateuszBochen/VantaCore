package vantaCore.application.sso.infrastructure.client;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import vantaCore.application.sso.domain.login.SsoProviderException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.stream.Collectors;

/** Small shared HTTP helpers for the provider clients - every transport/HTTP-status failure is
 turned into SsoProviderException here, so the clients themselves only deal with the happy path and
 provider-level error payloads. */
final class SsoHttp {

    private static final RestClient CLIENT = RestClient.create();

    private SsoHttp() {
    }

    static JsonNode getJson(String url, Map<String, String> headers) {
        try {
            return CLIENT.get()
                .uri(url)
                .headers(h -> headers.forEach(h::set))
                .retrieve()
                .body(JsonNode.class);
        } catch (RestClientException exception) {
            throw new SsoProviderException("GET " + url + " failed: " + exception.getMessage(), exception);
        }
    }

    static String getText(String url) {
        try {
            return CLIENT.get().uri(url).retrieve().body(String.class);
        } catch (RestClientException exception) {
            throw new SsoProviderException("GET " + url + " failed: " + exception.getMessage(), exception);
        }
    }

    /** application/x-www-form-urlencoded POST expecting a JSON answer - the shape every OAuth2 token
     endpoint uses. */
    static JsonNode postForm(String url, Map<String, String> form) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        form.forEach(body::add);

        try {
            return CLIENT.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .accept(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(JsonNode.class);
        } catch (RestClientException exception) {
            throw new SsoProviderException("POST " + url + " failed: " + exception.getMessage(), exception);
        }
    }

    /** Appends properly form-encoded query params (scope's spaces, redirect_uri's ":" and "/") to an
     endpoint that may already carry a query string of its own. */
    static String withQuery(String endpoint, Map<String, String> params) {
        String query = params.entrySet().stream()
            .filter(entry -> entry.getValue() != null)
            .map(entry -> encode(entry.getKey()) + "=" + encode(entry.getValue()))
            .collect(Collectors.joining("&"));

        return endpoint + (endpoint.contains("?") ? "&" : "?") + query;
    }

    static String text(JsonNode node, String field) {
        JsonNode value = node == null ? null : node.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
