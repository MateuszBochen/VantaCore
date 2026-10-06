package vantaCore.application.ticket.infrastructure.audit;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.domain.audit.AuditResourceType;
import vantaCore.application.shared.domain.audit.AuditSnapshotProviderInterface;
import vantaCore.application.ticket.domain.TicketSnapshot;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Component
public class TicketAuditSnapshotProvider implements AuditSnapshotProviderInterface {

    private final TicketAggregateRepositoryInterface repository;

    public TicketAuditSnapshotProvider(TicketAggregateRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public AuditResourceType resourceType() {
        return AuditResourceType.TICKET;
    }

    @Override
    public Optional<Map<String, Object>> loadSnapshot(UUID projectId, UUID resourceId) {
        return this.repository.findById(new TicketId(resourceId)).map(ticket -> toFieldMap(ticket.toSnapshot()));
    }

    // id/key/authorId/createdAt/changedAt are fixed or purely bookkeeping - not diff-worthy.
    // projectId is the audit entry's own scope, not one of its diffed fields.
    private Map<String, Object> toFieldMap(TicketSnapshot ticket) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("subProjectId", ticket.subProjectId());
        fields.put("issueTypeId", ticket.issueTypeId());
        fields.put("statusId", ticket.statusId());
        fields.put("parentId", ticket.parentId());
        fields.put("title", ticket.title());
        fields.put("description", ticket.description());
        fields.put("priority", ticket.priority());
        fields.put("estimate", ticket.estimate());
        fields.put("assigneeIds", ticket.assigneeIds());
        fields.put("flagIds", ticket.flagIds());
        fields.put("tags", ticket.tags());
        fields.put("customFields", ticket.customFields());
        fields.put("relatedTickets", ticket.relatedTickets());
        return fields;
    }
}
