package vantaCore.application.webhook.appliaction.query.listWebhookSubscriptions;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.WEBHOOK_VIEW)
final public class ListWebhookSubscriptionsQuery {

    @NotNull
    private final UUID projectId;

    public ListWebhookSubscriptionsQuery(UUID projectId) {
        this.projectId = projectId;
    }

    public UUID getProjectId() {
        return projectId;
    }
}
