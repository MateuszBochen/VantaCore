package vantaCore.application.webhook.appliaction.command.updateWebhookSubscription;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.webhook.appliaction.dto.UpdateWebhookSubscriptionRequest;

import java.util.UUID;

@RequiresResource(Resource.WEBHOOK_MANAGE)
final public class UpdateWebhookSubscriptionCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID subscriptionId;

    @Valid
    @NotNull
    private final UpdateWebhookSubscriptionRequest updateWebhookSubscriptionRequest;

    public UpdateWebhookSubscriptionCommand(UUID projectId, UUID subscriptionId, UpdateWebhookSubscriptionRequest updateWebhookSubscriptionRequest) {
        this.projectId = projectId;
        this.subscriptionId = subscriptionId;
        this.updateWebhookSubscriptionRequest = updateWebhookSubscriptionRequest;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getSubscriptionId() {
        return subscriptionId;
    }

    public UpdateWebhookSubscriptionRequest getUpdateWebhookSubscriptionRequest() {
        return updateWebhookSubscriptionRequest;
    }
}
