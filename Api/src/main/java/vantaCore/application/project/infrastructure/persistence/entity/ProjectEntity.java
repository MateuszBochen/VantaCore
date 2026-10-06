package vantaCore.application.project.infrastructure.persistence.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.project.domain.vo.AutomationRule;
import vantaCore.application.project.domain.vo.CustomFieldDefinition;
import vantaCore.application.project.domain.vo.Flag;
import vantaCore.application.project.domain.vo.IssueType;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.project.domain.vo.ProjectName;
import vantaCore.application.project.domain.vo.ProjectPrefix;
import vantaCore.application.project.domain.vo.StartingNumber;
import vantaCore.application.project.domain.vo.Status;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Entity
@Table(name = "projects")
public class ProjectEntity {

    @Id
    private UUID id;

    private String name;
    private String prefix;
    private Integer startingNumber;
    private String estimateUnit;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private Set<StatusEntity> statuses = new HashSet<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private Set<IssueTypeEntity> issueTypes = new HashSet<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private Set<AutomationRuleEntity> automationRules = new HashSet<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private Set<FlagEntity> flags = new HashSet<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private Set<CustomFieldDefinitionEntity> customFieldDefinitions = new HashSet<>();

    // Hibernate requires it
    protected ProjectEntity() {}

    private ProjectEntity(UUID id, String name, String prefix, Integer startingNumber, String estimateUnit) {
        this.id = id;
        this.name = name;
        this.prefix = prefix;
        this.startingNumber = startingNumber;
        this.estimateUnit = estimateUnit;
    }

    public static ProjectEntity fromDomain(ProjectAggregate project) {
        ProjectEntity entity = new ProjectEntity(
            project.getId().value(),
            project.getName() != null ? project.getName().value() : null,
            project.getPrefix() != null ? project.getPrefix().value() : null,
            project.getStartingNumber() != null ? project.getStartingNumber().value() : null,
            project.getEstimateUnit()
        );

        for (Status status : project.getStatuses()) {
            entity.statuses.add(StatusEntity.fromDomain(status, entity));
        }

        for (IssueType issueType : project.getIssueTypes()) {
            entity.issueTypes.add(IssueTypeEntity.fromDomain(issueType, entity));
        }

        for (AutomationRule rule : project.getAutomationRules()) {
            entity.automationRules.add(AutomationRuleEntity.fromDomain(rule, entity));
        }

        for (Flag flag : project.getFlags()) {
            entity.flags.add(FlagEntity.fromDomain(flag, entity));
        }

        for (CustomFieldDefinition customFieldDefinition : project.getCustomFieldDefinitions()) {
            entity.customFieldDefinitions.add(CustomFieldDefinitionEntity.fromDomain(customFieldDefinition, entity));
        }

        return entity;
    }

    public ProjectAggregate toDomain() {
        return new ProjectAggregate(
            new ProjectId(this.id),
            this.name != null ? new ProjectName(this.name) : null,
            this.prefix != null ? new ProjectPrefix(this.prefix) : null,
            this.startingNumber != null ? new StartingNumber(this.startingNumber) : null,
            this.estimateUnit,
            this.statuses.stream().map(StatusEntity::toDomain).collect(Collectors.toSet()),
            this.issueTypes.stream().map(IssueTypeEntity::toDomain).collect(Collectors.toSet()),
            this.automationRules.stream().map(AutomationRuleEntity::toDomain).collect(Collectors.toSet()),
            this.flags.stream().map(FlagEntity::toDomain).collect(Collectors.toSet()),
            this.customFieldDefinitions.stream().map(CustomFieldDefinitionEntity::toDomain).collect(Collectors.toSet())
        );
    }
}
