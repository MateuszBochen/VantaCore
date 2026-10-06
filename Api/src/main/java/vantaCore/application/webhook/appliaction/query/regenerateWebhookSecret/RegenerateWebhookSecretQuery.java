package vantaCore.application.webhook.appliaction.query.regenerateWebhookSecret;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

// QueryBus - needs to hand back the freshly generated secret, shown once, same reasoning as
// CreateWebhookSubscriptionQuery. Covers the "lost the secret" recovery gap called out explicitly
// for this feature (same gap VCS Integration has via its own webhook secret regeneration).
@RequiresResource(Resource.WEBHOOK_MANAGE)
final public class RegenerateWebhookSecretQuery {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID subscriptionId;

    public RegenerateWebhookSecretQuery(UUID projectId, UUID subscriptionId) {
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
