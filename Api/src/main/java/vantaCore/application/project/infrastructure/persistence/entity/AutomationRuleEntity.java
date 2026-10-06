package vantaCore.application.project.infrastructure.persistence.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import vantaCore.application.project.domain.vo.AutomationRule;

import java.util.UUID;

@Entity
@Table(name = "project_automation_rules")
public class AutomationRuleEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private ProjectEntity project;

    private UUID parentTypeId;
    private UUID setParentStatusId;

    // Hibernate requires it
    protected AutomationRuleEntity() {}

    private AutomationRuleEntity(
        UUID id,
        ProjectEntity project,
        UUID parentTypeId,
        UUID setParentStatusId
    ) {
        this.id = id;
        this.project = project;
        this.parentTypeId = parentTypeId;
        this.setParentStatusId = setParentStatusId;
    }

    public static AutomationRuleEntity fromDomain(AutomationRule rule, ProjectEntity project) {
        return new AutomationRuleEntity(
            rule.id(),
            project,
            rule.parentTypeId(),
            rule.setParentStatusId()
        );
    }

    public AutomationRule toDomain() {
        return new AutomationRule(
            this.id,
            this.parentTypeId,
            this.setParentStatusId
        );
    }
}
