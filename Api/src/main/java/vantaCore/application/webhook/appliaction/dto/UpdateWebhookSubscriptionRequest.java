package vantaCore.application.webhook.appliaction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.webhook.domain.vo.WebhookEventType;

import java.util.Set;

/** Deliberately excludes targetType and secret - type/secret can't be edited this way (changing
 type means delete+recreate; secret has its own regeneration endpoint), see
 WebhookSubscriptionAggregate.changeSubscription(). */
final public class UpdateWebhookSubscriptionRequest {

    @NotEmpty
    private final Set<WebhookEventType> eventTypes;

    @NotBlank
    private final String targetUrl;

    @NotNull
    private final Boolean enabled;

    public UpdateWebhookSubscriptionRequest(Set<WebhookEventType> eventTypes, String targetUrl, Boolean enabled) {
        this.eventTypes = eventTypes;
        this.targetUrl = targetUrl;
        this.enabled = enabled;
    }

    public Set<WebhookEventType> getEventTypes() {
        return eventTypes;
    }

    public String getTargetUrl() {
        return targetUrl;
    }

    public Boolean getEnabled() {
        return enabled;
    }
}
