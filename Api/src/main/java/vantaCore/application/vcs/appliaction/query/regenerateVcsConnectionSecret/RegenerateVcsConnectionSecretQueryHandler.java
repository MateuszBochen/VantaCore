package vantaCore.application.vcs.appliaction.query.regenerateVcsConnectionSecret;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.exception.VcsConnectionNotFoundException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.shared.infrastructure.security.SecretGenerator;
import vantaCore.application.vcs.appliaction.query.createVcsConnection.VcsConnectionResult;
import vantaCore.application.vcs.appliaction.service.VcsWebhookUrl;
import vantaCore.application.vcs.domain.VcsConnectionAggregate;
import vantaCore.application.vcs.domain.VcsConnectionSnapshot;
import vantaCore.application.vcs.domain.repository.VcsConnectionRepositoryInterface;
import vantaCore.application.vcs.domain.vo.VcsConnectionId;

@Component
final public class RegenerateVcsConnectionSecretQueryHandler
    implements QueryHandlerInterface<RegenerateVcsConnectionSecretQuery, Item<VcsConnectionResult>> {

    private final VcsConnectionRepositoryInterface connectionRepository;
    private final VcsWebhookUrl webhookUrl;
    private final SecretGenerator secretGenerator;

    public RegenerateVcsConnectionSecretQueryHandler(
        VcsConnectionRepositoryInterface connectionRepository,
        VcsWebhookUrl webhookUrl,
        SecretGenerator secretGenerator
    ) {
        this.connectionRepository = connectionRepository;
        this.webhookUrl = webhookUrl;
        this.secretGenerator = secretGenerator;
    }

    @Override
    public Item<VcsConnectionResult> handle(RegenerateVcsConnectionSecretQuery query) {
        VcsConnectionId connectionId = new VcsConnectionId(query.getConnectionId());

        VcsConnectionSnapshot snapshot = this.connectionRepository.findById(connectionId)
            .orElseThrow(VcsConnectionNotFoundException::new);

        if (!snapshot.projectId().equals(query.getProjectId())) {
            throw new VcsConnectionNotFoundException();
        }

        String newSecret = this.secretGenerator.generate();

        VcsConnectionAggregate connection = VcsConnectionAggregate.newConnection(
            snapshot.id(), snapshot.projectId(), snapshot.provider(), snapshot.repoUrl(), snapshot.webhookSecret(),
            snapshot.createdByUserId(), snapshot.createdAt()
        ).regenerateSecret(newSecret);

        this.connectionRepository.save(connection);

        // Re-derived, not the snapshot's old one - Bitbucket embeds the secret in the URL itself
        // (see VcsWebhookUrl), so the URL the caller needs to re-paste into their provider changes
        // along with the secret for that one provider; for the other three it's the same URL as
        // before, just shown again for consistency.
        String url = this.webhookUrl.of(snapshot.provider(), connectionId, newSecret);
        VcsConnectionResult result = new VcsConnectionResult(connectionId.value(), snapshot.provider(), snapshot.repoUrl(), url, newSecret);

        return Item.fromPayload(connectionId.toString(), result);
    }
}
