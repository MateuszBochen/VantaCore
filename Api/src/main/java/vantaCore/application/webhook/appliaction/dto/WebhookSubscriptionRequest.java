package vantaCore.application.webhook.appliaction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.webhook.domain.vo.WebhookEventType;
import vantaCore.application.webhook.domain.vo.WebhookTargetType;

import java.util.Set;

final public class WebhookSubscriptionRequest {

    @NotEmpty
    private final Set<WebhookEventType> eventTypes;

    @NotNull
    private final WebhookTargetType targetType;

    @NotBlank
    private final String targetUrl;

    public WebhookSubscriptionRequest(Set<WebhookEventType> eventTypes, WebhookTargetType targetType, String targetUrl) {
        this.eventTypes = eventTypes;
        this.targetType = targetType;
        this.targetUrl = targetUrl;
    }

    public Set<WebhookEventType> getEventTypes() {
        return eventTypes;
    }

    public WebhookTargetType getTargetType() {
        return targetType;
    }

    public String getTargetUrl() {
        return targetUrl;
    }
}
