package vantaCore.application.webhook.appliaction.query.listWebhookDeliveries;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.WEBHOOK_VIEW)
final public class ListWebhookDeliveriesQuery {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID subscriptionId;

    @Min(0)
    private final int page;

    @Min(1)
    private final int limit;

    public ListWebhookDeliveriesQuery(UUID projectId, UUID subscriptionId, int page, int limit) {
        this.projectId = projectId;
        this.subscriptionId = subscriptionId;
        this.page = page;
        this.limit = limit;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getSubscriptionId() {
        return subscriptionId;
    }

    public int getPage() {
        return page;
    }

    public int getLimit() {
        return limit;
    }
}
