package vantaCore.application.project.appliaction.query.getProject;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.AutomationRule;
import vantaCore.application.project.domain.vo.CustomFieldDefinition;
import vantaCore.application.project.domain.vo.CustomFieldType;
import vantaCore.application.project.domain.vo.Flag;
import vantaCore.application.project.domain.vo.IssueType;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.project.domain.vo.Status;
import vantaCore.application.project.domain.vo.WorkflowStep;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;

import java.util.Set;
import java.util.stream.Collectors;

@Component
final public class GetProjectQueryHandler implements QueryHandlerInterface<GetProjectQuery, Item<ProjectResult>> {

    private final ProjectAggregateRepositoryInterface repository;

    public GetProjectQueryHandler(ProjectAggregateRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public Item<ProjectResult> handle(GetProjectQuery query) {
        ProjectId id = new ProjectId(query.getProjectId());

        ProjectAggregate project = this.repository.findById(id)
            .orElseThrow(ProjectNotFoundException::new);

        return Item.fromPayload(id.toString(), toResult(project));
    }

    private ProjectResult toResult(ProjectAggregate project) {
        return new ProjectResult(
            project.getId().value(),
            project.getName() != null ? project.getName().value() : null,
            project.getPrefix() != null ? project.getPrefix().value() : null,
            project.getStartingNumber() != null ? project.getStartingNumber().value() : null,
            project.getEstimateUnit(),
            toStatusResults(project.getStatuses()),
            toIssueTypeResults(project.getIssueTypes()),
            toAutomationRuleResults(project.getAutomationRules()),
            toFlagResults(project.getFlags()),
            toCustomFieldDefinitionResults(project.getCustomFieldDefinitions())
        );
    }

    private Set<IssueTypeResult> toIssueTypeResults(Set<IssueType> issueTypes) {
        return issueTypes.stream()
            .map(issueType -> new IssueTypeResult(
                issueType.id(),
                issueType.name(),
                issueType.color(),
                issueType.estimable(),
                toWorkflowResults(issueType.workflow()),
                issueType.initialStatusId(),
                issueType.childTypeIds(),
                issueType.titleTemplate(),
                issueType.descriptionTemplate()
            ))
            .collect(Collectors.toSet());
    }

    private Set<StatusResult> toStatusResults(Set<Status> statuses) {
        return statuses.stream()
            .map(status -> new StatusResult(
                status.id(),
                status.name(),
                status.color(),
                status.isDone()
            ))
            .collect(Collectors.toSet());
    }

    private Set<WorkflowStepResult> toWorkflowResults(Set<WorkflowStep> workflow) {
        return workflow.stream()
            .map(step -> new WorkflowStepResult(step.statusId(), step.allowedTransitionIds()))
            .collect(Collectors.toSet());
    }

    private Set<AutomationRuleResult> toAutomationRuleResults(Set<AutomationRule> rules) {
        return rules.stream()
            .map(rule -> new AutomationRuleResult(
                rule.id(),
                rule.parentTypeId(),
                rule.setParentStatusId()
            ))
            .collect(Collectors.toSet());
    }

    private Set<FlagResult> toFlagResults(Set<Flag> flags) {
        return flags.stream()
            .map(flag -> new FlagResult(
                flag.id(),
                flag.name(),
                flag.color()
            ))
            .collect(Collectors.toSet());
    }

    private Set<CustomFieldDefinitionResult> toCustomFieldDefinitionResults(Set<CustomFieldDefinition> customFieldDefinitions) {
        return customFieldDefinitions.stream()
            .map(customFieldDefinition -> new CustomFieldDefinitionResult(
                customFieldDefinition.id(),
                customFieldDefinition.name(),
                toTypeString(customFieldDefinition.type()),
                customFieldDefinition.options(),
                customFieldDefinition.multiple()
            ))
            .collect(Collectors.toSet());
    }

    // CustomFieldType.DATETIME is camelCase ("dateTime") on the wire to match the frontend's
    // CustomFieldType union - every other constant is a single lowercase word, so only this one
    // needs special-casing instead of a plain .name().toLowerCase().
    private String toTypeString(CustomFieldType type) {
        if (type == null) {
            return null;
        }

        return type == CustomFieldType.DATETIME ? "dateTime" : type.name().toLowerCase();
    }
}
