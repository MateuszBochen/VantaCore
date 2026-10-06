package vantaCore.application.project.infrastructure.audit;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.domain.audit.AuditResourceType;
import vantaCore.application.shared.domain.audit.AuditSnapshotProviderInterface;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Component
public class ProjectAuditSnapshotProvider implements AuditSnapshotProviderInterface {

    private final ProjectAggregateRepositoryInterface repository;

    public ProjectAuditSnapshotProvider(ProjectAggregateRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public AuditResourceType resourceType() {
        return AuditResourceType.PROJECT;
    }

    @Override
    public Optional<Map<String, Object>> loadSnapshot(UUID projectId, UUID resourceId) {
        return this.repository.findById(new ProjectId(resourceId)).map(this::toFieldMap);
    }

    private Map<String, Object> toFieldMap(ProjectAggregate project) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("name", project.getName() != null ? project.getName().value() : null);
        fields.put("prefix", project.getPrefix() != null ? project.getPrefix().value() : null);
        fields.put("startingNumber", project.getStartingNumber() != null ? project.getStartingNumber().value() : null);
        fields.put("estimateUnit", project.getEstimateUnit());
        fields.put("statuses", project.getStatuses());
        fields.put("issueTypes", project.getIssueTypes());
        fields.put("automationRules", project.getAutomationRules());
        fields.put("flags", project.getFlags());
        fields.put("customFieldDefinitions", project.getCustomFieldDefinitions());
        return fields;
    }
}
