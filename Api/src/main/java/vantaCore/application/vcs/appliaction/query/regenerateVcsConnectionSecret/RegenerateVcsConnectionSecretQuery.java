package vantaCore.application.vcs.appliaction.query.regenerateVcsConnectionSecret;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

// QueryBus, not CommandBus - needs to hand back the freshly generated secret (and, for Bitbucket,
// the re-derived webhookUrl) - same "needs to hand back a result" precedent as
// CreateVcsConnectionQuery/RegenerateWebhookSecretQuery. Closes the same "lost the secret" recovery
// gap the Integrations & Webhooks sub-project called out explicitly for this feature.
@RequiresResource(Resource.VCS_CONNECTION_MANAGE)
final public class RegenerateVcsConnectionSecretQuery {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID connectionId;

    public RegenerateVcsConnectionSecretQuery(UUID projectId, UUID connectionId) {
        this.projectId = projectId;
        this.connectionId = connectionId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getConnectionId() {
        return connectionId;
    }
}
