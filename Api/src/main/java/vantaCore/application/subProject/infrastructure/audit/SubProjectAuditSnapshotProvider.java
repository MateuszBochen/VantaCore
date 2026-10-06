package vantaCore.application.subProject.infrastructure.audit;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.domain.audit.AuditResourceType;
import vantaCore.application.shared.domain.audit.AuditSnapshotProviderInterface;
import vantaCore.application.subProject.domain.SubProjectAggregate;
import vantaCore.application.subProject.domain.repository.SubProjectRepositoryInterface;
import vantaCore.application.subProject.domain.vo.SubProjectDocumentation;
import vantaCore.application.subProject.domain.vo.SubProjectId;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Component
public class SubProjectAuditSnapshotProvider implements AuditSnapshotProviderInterface {

    private final SubProjectRepositoryInterface repository;

    public SubProjectAuditSnapshotProvider(SubProjectRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public AuditResourceType resourceType() {
        return AuditResourceType.SUB_PROJECT;
    }

    @Override
    public Optional<Map<String, Object>> loadSnapshot(UUID projectId, UUID resourceId) {
        return this.repository.findLatestBySubProjectId(new ProjectId(projectId), new SubProjectId(resourceId))
            .map(this::toFieldMap);
    }

    // documentation is flattened one level (scope/impactAnalysis/solutionDesign/adrs as their own
    // top-level diff keys) instead of diffed as one "documentation" blob - still a shallow, direct
    // comparison (not deep object diffing), just avoids every doc edit re-capturing the entire
    // markdown payload of every OTHER section that didn't change.
    private Map<String, Object> toFieldMap(SubProjectAggregate subProject) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("name", subProject.getName() != null ? subProject.getName().value() : null);
        fields.put("status", subProject.getStatus());

        SubProjectDocumentation documentation = subProject.getDocumentation();
        if (documentation != null) {
            fields.put("documentation.scope", documentation.scope());
            fields.put("documentation.impactAnalysis", documentation.impactAnalysis());
            fields.put("documentation.solutionDesign", documentation.solutionDesign());
            fields.put("documentation.adrs", documentation.adrs());
        }

        return fields;
    }
}
