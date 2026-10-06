package vantaCore.application.project.infrastructure.persistence.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import vantaCore.application.project.domain.vo.WorkflowStep;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "project_issue_type_workflow_steps")
public class WorkflowStepEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issue_type_id")
    private IssueTypeEntity issueType;

    private UUID statusId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "project_workflow_step_transitions",
        joinColumns = @JoinColumn(name = "workflow_step_id")
    )
    @Column(name = "target_status_id")
    private Set<UUID> allowedTransitionIds = new HashSet<>();

    // Hibernate requires it
    protected WorkflowStepEntity() {}

    private WorkflowStepEntity(UUID id, IssueTypeEntity issueType, UUID statusId, Set<UUID> allowedTransitionIds) {
        this.id = id;
        this.issueType = issueType;
        this.statusId = statusId;
        this.allowedTransitionIds = allowedTransitionIds;
    }

    public static WorkflowStepEntity fromDomain(WorkflowStep step, IssueTypeEntity issueType) {
        return new WorkflowStepEntity(UUID.randomUUID(), issueType, step.statusId(), new HashSet<>(step.allowedTransitionIds()));
    }

    public WorkflowStep toDomain() {
        return new WorkflowStep(this.statusId, this.allowedTransitionIds);
    }
}
