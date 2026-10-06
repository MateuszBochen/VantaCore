package vantaCore.application.webhook.appliaction.command.deleteWebhookSubscription;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.WEBHOOK_MANAGE)
final public class DeleteWebhookSubscriptionCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID subscriptionId;

    public DeleteWebhookSubscriptionCommand(UUID projectId, UUID subscriptionId) {
        this.projectId = projectId;
        this.subscriptionId = subscriptionId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getSubscriptionId() {
        return subscriptionId;
    }
}
