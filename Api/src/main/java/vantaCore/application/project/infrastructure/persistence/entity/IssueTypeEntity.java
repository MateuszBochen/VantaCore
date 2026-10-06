package vantaCore.application.project.infrastructure.persistence.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import vantaCore.application.project.domain.vo.IssueType;
import vantaCore.application.project.domain.vo.WorkflowStep;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Entity
@Table(name = "project_issue_types")
public class IssueTypeEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private ProjectEntity project;

    private String name;
    private String color;
    private boolean estimable;
    private UUID initialStatusId;

    @Column(columnDefinition = "text")
    private String titleTemplate;

    @Column(columnDefinition = "text")
    private String descriptionTemplate;

    @OneToMany(mappedBy = "issueType", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private Set<WorkflowStepEntity> workflow = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "project_issue_type_child_types",
        joinColumns = @JoinColumn(name = "issue_type_id")
    )
    @Column(name = "child_type_id")
    private Set<UUID> childTypeIds = new HashSet<>();

    // Hibernate requires it
    protected IssueTypeEntity() {}

    private IssueTypeEntity(
        UUID id,
        ProjectEntity project,
        String name,
        String color,
        boolean estimable,
        UUID initialStatusId,
        Set<UUID> childTypeIds,
        String titleTemplate,
        String descriptionTemplate
    ) {
        this.id = id;
        this.project = project;
        this.name = name;
        this.color = color;
        this.estimable = estimable;
        this.initialStatusId = initialStatusId;
        this.childTypeIds = childTypeIds;
        this.titleTemplate = titleTemplate;
        this.descriptionTemplate = descriptionTemplate;
    }

    public static IssueTypeEntity fromDomain(IssueType issueType, ProjectEntity project) {
        IssueTypeEntity entity = new IssueTypeEntity(
            issueType.id(),
            project,
            issueType.name(),
            issueType.color(),
            issueType.estimable(),
            issueType.initialStatusId(),
            new HashSet<>(issueType.childTypeIds()),
            issueType.titleTemplate(),
            issueType.descriptionTemplate()
        );

        for (WorkflowStep step : issueType.workflow()) {
            entity.workflow.add(WorkflowStepEntity.fromDomain(step, entity));
        }

        return entity;
    }

    public IssueType toDomain() {
        return new IssueType(
            this.id,
            this.name,
            this.color,
            this.estimable,
            this.workflow.stream().map(WorkflowStepEntity::toDomain).collect(Collectors.toSet()),
            this.initialStatusId,
            this.childTypeIds,
            this.titleTemplate,
            this.descriptionTemplate
        );
    }
}
