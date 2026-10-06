package vantaCore.application.importExport.appliaction.query.createImportConnection;

import org.springframework.stereotype.Component;
import vantaCore.application.importExport.appliaction.dto.CreateImportConnectionRequest;
import vantaCore.application.importExport.domain.ImportConnectionAggregate;
import vantaCore.application.importExport.domain.repository.ImportConnectionRepositoryInterface;
import vantaCore.application.importExport.domain.vo.ImportConnectionId;
import vantaCore.application.importExport.domain.vo.ImportProvider;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.exception.UnprocessableEntityException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
final public class CreateImportConnectionQueryHandler
    implements QueryHandlerInterface<CreateImportConnectionQuery, Item<ImportConnectionResult>> {

    private final ProjectAggregateRepositoryInterface projectRepository;
    private final ImportConnectionRepositoryInterface connectionRepository;
    private final CurrentUserProviderInterface currentUserProvider;

    public CreateImportConnectionQueryHandler(
        ProjectAggregateRepositoryInterface projectRepository,
        ImportConnectionRepositoryInterface connectionRepository,
        CurrentUserProviderInterface currentUserProvider
    ) {
        this.projectRepository = projectRepository;
        this.connectionRepository = connectionRepository;
        this.currentUserProvider = currentUserProvider;
    }

    @Override
    public Item<ImportConnectionResult> handle(CreateImportConnectionQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());
        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        CreateImportConnectionRequest request = query.getCreateImportConnectionRequest();

        if (request.getProvider() == ImportProvider.CSV) {
            throw new UnprocessableEntityException(List.of(new Notification(
                "import-connection-not-applicable",
                "CSV import does not use a connection",
                true
            )));
        }

        ImportConnectionId connectionId = new ImportConnectionId(UUID.randomUUID());

        ImportConnectionAggregate connection = ImportConnectionAggregate.newConnection(
            connectionId,
            projectId.value(),
            request.getProvider(),
            normalizeBaseUrl(request.getBaseUrl()),
            blankToNull(request.getSourceProject()),
            blankToNull(request.getEmail()),
            request.getToken(),
            this.currentUserProvider.getCurrentUserId().value(),
            Instant.now()
        );

        this.connectionRepository.save(connection);

        ImportConnectionResult result = new ImportConnectionResult(connectionId.value());

        return Item.fromPayload(connectionId.toString(), result);
    }

    // The frontend's repo/instance URL field doesn't require the user to type a scheme (e.g.
    // "mateusz-bochen.atlassian.net"), but RestClient needs an absolute URI - default to https,
    // every provider this feature targets is https-only anyway.
    private String normalizeBaseUrl(String baseUrl) {
        String trimmed = baseUrl.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed;
        }
        return "https://" + trimmed;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
