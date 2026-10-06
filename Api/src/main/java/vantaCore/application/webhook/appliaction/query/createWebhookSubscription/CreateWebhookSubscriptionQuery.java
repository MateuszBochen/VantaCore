package vantaCore.application.webhook.appliaction.query.createWebhookSubscription;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.webhook.appliaction.dto.WebhookSubscriptionRequest;

import java.util.UUID;

// QueryBus, not CommandBus - needs to hand back the server-generated id and (GENERIC only) secret,
// same "needs to hand back a result" precedent as CreateVcsConnectionQuery.
@RequiresResource(Resource.WEBHOOK_MANAGE)
final public class CreateWebhookSubscriptionQuery {

    @NotNull
    private final UUID projectId;

    @Valid
    @NotNull
    private final WebhookSubscriptionRequest webhookSubscriptionRequest;

    public CreateWebhookSubscriptionQuery(UUID projectId, WebhookSubscriptionRequest webhookSubscriptionRequest) {
        this.projectId = projectId;
        this.webhookSubscriptionRequest = webhookSubscriptionRequest;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public WebhookSubscriptionRequest getWebhookSubscriptionRequest() {
        return webhookSubscriptionRequest;
    }
}
