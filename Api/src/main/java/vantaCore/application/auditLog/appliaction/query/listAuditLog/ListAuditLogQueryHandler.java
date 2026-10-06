package vantaCore.application.auditLog.appliaction.query.listAuditLog;

import org.springframework.stereotype.Component;
import vantaCore.application.auditLog.domain.AuditLogEntry;
import vantaCore.application.auditLog.domain.repository.AuditLogEntryRepositoryInterface;
import vantaCore.application.auditLog.domain.repository.AuditLogEntryRepositoryInterface.AuditLogFilter;
import vantaCore.application.auditLog.domain.repository.AuditLogEntryRepositoryInterface.AuditLogPage;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;

import java.util.List;

@Component
final public class ListAuditLogQueryHandler implements QueryHandlerInterface<ListAuditLogQuery, Collection<AuditLogEntryResult>> {

    private final ProjectAggregateRepositoryInterface projectRepository;
    private final AuditLogEntryRepositoryInterface repository;

    public ListAuditLogQueryHandler(
        ProjectAggregateRepositoryInterface projectRepository,
        AuditLogEntryRepositoryInterface repository
    ) {
        this.projectRepository = projectRepository;
        this.repository = repository;
    }

    @Override
    public Collection<AuditLogEntryResult> handle(ListAuditLogQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());
        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        AuditLogFilter filter = new AuditLogFilter(
            query.getActorId(), query.getResourceType(), query.getAction(), query.getFrom(), query.getTill()
        );

        AuditLogPage result = this.repository.findAllByProjectId(projectId.value(), filter, query.getPage(), query.getLimit());

        List<Item<AuditLogEntryResult>> items = result.items().stream()
            .map(this::toResult)
            .map(entry -> Item.fromPayload(entry.id().toString(), entry))
            .toList();

        return new Collection<>(query.getPage(), query.getLimit(), result.total(), items);
    }

    private AuditLogEntryResult toResult(AuditLogEntry entry) {
        return new AuditLogEntryResult(
            entry.id(),
            entry.projectId(),
            entry.resourceType(),
            entry.resourceId(),
            entry.action(),
            entry.actorId(),
            entry.actorEmail(),
            entry.occurredAt(),
            entry.diff()
        );
    }
}
