package vantaCore.application.importExport.appliaction.query.startImport;

import org.springframework.stereotype.Component;
import vantaCore.application.importExport.appliaction.service.ImportJobRunner;
import vantaCore.application.importExport.domain.ImportConnectionSnapshot;
import vantaCore.application.importExport.domain.ImportJobAggregate;
import vantaCore.application.importExport.domain.mapping.ValueMapping;
import vantaCore.application.importExport.domain.repository.ImportConnectionRepositoryInterface;
import vantaCore.application.importExport.domain.repository.ImportJobRepositoryInterface;
import vantaCore.application.importExport.domain.vo.ImportConnectionId;
import vantaCore.application.importExport.domain.vo.ImportJobId;
import vantaCore.application.importExport.domain.vo.ImportProvider;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.exception.ImportConnectionNotFoundException;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.exception.UnprocessableEntityException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
final public class StartImportQueryHandler implements QueryHandlerInterface<StartImportQuery, Item<StartImportResult>> {

    private final ProjectAggregateRepositoryInterface projectRepository;
    private final ImportConnectionRepositoryInterface connectionRepository;
    private final ImportJobRepositoryInterface jobRepository;
    private final ImportJobRunner jobRunner;
    private final CurrentUserProviderInterface currentUserProvider;

    public StartImportQueryHandler(
        ProjectAggregateRepositoryInterface projectRepository,
        ImportConnectionRepositoryInterface connectionRepository,
        ImportJobRepositoryInterface jobRepository,
        ImportJobRunner jobRunner,
        CurrentUserProviderInterface currentUserProvider
    ) {
        this.projectRepository = projectRepository;
        this.connectionRepository = connectionRepository;
        this.jobRepository = jobRepository;
        this.jobRunner = jobRunner;
        this.currentUserProvider = currentUserProvider;
    }

    @Override
    public Item<StartImportResult> handle(StartImportQuery query) {
        UUID projectId = query.getProjectId();
        this.projectRepository.findById(new ProjectId(projectId)).orElseThrow(ProjectNotFoundException::new);

        if (query.getProvider() == ImportProvider.CSV) {
            assertPresent(query.getCsvContent() != null && query.getCsvContent().length > 0, "csv-file-required", "A CSV file is required");
        } else {
            assertPresent(query.getConnectionId() != null, "connection-required", "A connection is required for this provider");

            ImportConnectionSnapshot connection = this.connectionRepository.findById(new ImportConnectionId(query.getConnectionId()))
                .orElseThrow(ImportConnectionNotFoundException::new);

            if (connection.provider() != query.getProvider()) {
                throw new UnprocessableEntityException(List.of(new Notification(
                    "connection-provider-mismatch",
                    "This connection was not created for the given provider",
                    true
                )));
            }
        }

        UUID currentUserId = this.currentUserProvider.getCurrentUserId().value();
        ImportJobId jobId = new ImportJobId(UUID.randomUUID());
        Instant now = Instant.now();

        this.jobRepository.save(ImportJobAggregate.newJob(jobId, projectId, currentUserId, now));

        this.jobRunner.runAsync(
            jobId,
            projectId,
            currentUserId,
            query.getProvider(),
            query.getConnectionId(),
            query.getCsvContent(),
            query.getMapping(),
            toValueMap(query.getValueMappings())
        );

        StartImportResult result = new StartImportResult(jobId.value());

        return Item.fromPayload(jobId.toString(), result);
    }

    private Map<String, UUID> toValueMap(List<ValueMapping> valueMappings) {
        if (valueMappings == null) {
            return Map.of();
        }

        Map<String, UUID> map = new HashMap<>();
        for (ValueMapping valueMapping : valueMappings) {
            map.put(valueMapping.sourceValue(), valueMapping.targetId());
        }
        return map;
    }

    private void assertPresent(boolean present, String code, String message) {
        if (!present) {
            throw new UnprocessableEntityException(List.of(new Notification(code, message, true)));
        }
    }
}
