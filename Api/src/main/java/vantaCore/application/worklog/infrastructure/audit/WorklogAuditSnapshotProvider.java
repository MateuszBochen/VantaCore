package vantaCore.application.worklog.infrastructure.audit;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.domain.audit.AuditResourceType;
import vantaCore.application.shared.domain.audit.AuditSnapshotProviderInterface;
import vantaCore.application.worklog.domain.WorklogEntryAggregate;
import vantaCore.application.worklog.domain.WorklogEntrySnapshot;
import vantaCore.application.worklog.domain.repository.WorklogEntryAggregateRepositoryInterface;
import vantaCore.application.worklog.domain.vo.WorklogEntryId;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Component
public class WorklogAuditSnapshotProvider implements AuditSnapshotProviderInterface {

    private final WorklogEntryAggregateRepositoryInterface repository;

    public WorklogAuditSnapshotProvider(WorklogEntryAggregateRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public AuditResourceType resourceType() {
        return AuditResourceType.WORKLOG;
    }

    // ticketId/userId/createdAt are fixed for an entry's lifetime - minutes/date/note are the only
    // fields UpdateWorklogCommand can ever change.
    @Override
    public Optional<Map<String, Object>> loadSnapshot(UUID projectId, UUID resourceId) {
        return this.repository.findById(new WorklogEntryId(resourceId)).map(this::toFieldMap);
    }

    private Map<String, Object> toFieldMap(WorklogEntryAggregate entry) {
        WorklogEntrySnapshot snapshot = entry.toSnapshot();
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("minutes", snapshot.minutes());
        fields.put("date", snapshot.date());
        fields.put("note", snapshot.note());
        return fields;
    }
}
