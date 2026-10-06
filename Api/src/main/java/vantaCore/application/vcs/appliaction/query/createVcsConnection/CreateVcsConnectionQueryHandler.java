package vantaCore.application.vcs.appliaction.query.createVcsConnection;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;
import vantaCore.application.shared.infrastructure.security.SecretGenerator;
import vantaCore.application.vcs.appliaction.dto.CreateVcsConnectionRequest;
import vantaCore.application.vcs.appliaction.service.VcsWebhookUrl;
import vantaCore.application.vcs.domain.VcsConnectionAggregate;
import vantaCore.application.vcs.domain.repository.VcsConnectionRepositoryInterface;
import vantaCore.application.vcs.domain.vo.VcsConnectionId;

import java.time.Instant;
import java.util.UUID;

@Component
final public class CreateVcsConnectionQueryHandler implements QueryHandlerInterface<CreateVcsConnectionQuery, Item<VcsConnectionResult>> {

    private final ProjectAggregateRepositoryInterface projectRepository;
    private final VcsConnectionRepositoryInterface connectionRepository;
    private final VcsWebhookUrl webhookUrl;
    private final CurrentUserProviderInterface currentUserProvider;
    private final SecretGenerator secretGenerator;

    public CreateVcsConnectionQueryHandler(
        ProjectAggregateRepositoryInterface projectRepository,
        VcsConnectionRepositoryInterface connectionRepository,
        VcsWebhookUrl webhookUrl,
        CurrentUserProviderInterface currentUserProvider,
        SecretGenerator secretGenerator
    ) {
        this.projectRepository = projectRepository;
        this.connectionRepository = connectionRepository;
        this.webhookUrl = webhookUrl;
        this.currentUserProvider = currentUserProvider;
        this.secretGenerator = secretGenerator;
    }

    @Override
    public Item<VcsConnectionResult> handle(CreateVcsConnectionQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());
        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        CreateVcsConnectionRequest request = query.getCreateVcsConnectionRequest();
        VcsConnectionId connectionId = new VcsConnectionId(UUID.randomUUID());
        String secret = this.secretGenerator.generate();

        VcsConnectionAggregate connection = VcsConnectionAggregate.newConnection(
            connectionId,
            projectId.value(),
            request.getProvider(),
            request.getRepoUrl(),
            secret,
            this.currentUserProvider.getCurrentUserId().value(),
            Instant.now()
        );

        this.connectionRepository.save(connection);

        String url = this.webhookUrl.of(request.getProvider(), connectionId, secret);
        VcsConnectionResult result = new VcsConnectionResult(connectionId.value(), request.getProvider(), request.getRepoUrl(), url, secret);

        return Item.fromPayload(connectionId.toString(), result);
    }
}
