package vantaCore.application.project.appliaction.command.upsertProject;

import org.springframework.stereotype.Component;
import vantaCore.application.project.appliaction.dto.AutomationRuleRequest;
import vantaCore.application.project.appliaction.dto.CustomFieldDefinitionRequest;
import vantaCore.application.project.appliaction.dto.FlagRequest;
import vantaCore.application.project.appliaction.dto.IssueTypeRequest;
import vantaCore.application.project.appliaction.dto.StatusRequest;
import vantaCore.application.project.appliaction.dto.UpsertProjectRequest;
import vantaCore.application.project.appliaction.dto.WorkflowStepRequest;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.project.domain.policy.UpsertProjectPolicy;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.AutomationRule;
import vantaCore.application.project.domain.vo.CustomFieldDefinition;
import vantaCore.application.project.domain.vo.CustomFieldType;
import vantaCore.application.project.domain.vo.Flag;
import vantaCore.application.project.domain.vo.IssueType;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.project.domain.vo.ProjectName;
import vantaCore.application.project.domain.vo.ProjectPrefix;
import vantaCore.application.project.domain.vo.StartingNumber;
import vantaCore.application.project.domain.vo.Status;
import vantaCore.application.project.domain.vo.WorkflowStep;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.event.EventBusInterface;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
final public class UpsertProjectCommandHandler implements CommandHandlerInterface<UpsertProjectCommand> {

    private final UpsertProjectPolicy upsertProjectPolicy;
    private final ProjectAggregateRepositoryInterface repository;
    private final TicketAggregateRepositoryInterface ticketRepository;
    private final EventBusInterface eventBus;

    public UpsertProjectCommandHandler(
        UpsertProjectPolicy upsertProjectPolicy,
        ProjectAggregateRepositoryInterface repository,
        TicketAggregateRepositoryInterface ticketRepository,
        EventBusInterface eventBus
    ) {
        this.upsertProjectPolicy = upsertProjectPolicy;
        this.repository = repository;
        this.ticketRepository = ticketRepository;
        this.eventBus = eventBus;
    }

    @Override
    public Void handle(UpsertProjectCommand command) {
        UpsertProjectRequest request = command.getUpsertProjectRequest();

        ProjectAggregate project = new ProjectAggregate(
            new ProjectId(command.getProjectId()),
            request.getName() != null ? new ProjectName(request.getName()) : null,
            request.getPrefix() != null ? new ProjectPrefix(request.getPrefix()) : null,
            request.getStartingNumber() != null ? new StartingNumber(request.getStartingNumber()) : null,
            request.getEstimateUnit(),
            toStatuses(request.getStatuses()),
            toIssueTypes(request.getIssueTypes()),
            toAutomationRules(request.getAutomationRules()),
            toFlags(request.getFlags()),
            toCustomFieldDefinitions(request.getCustomFieldDefinitions())
        );

        this.upsertProjectPolicy.check(project).assertAllowed();

        ProjectAggregate previous = this.repository.findById(project.getId()).orElse(null);

        this.repository.save(project);

        // Published AFTER the save, so reactors computing "is this ticket done" (sprint estimates)
        // already see the new flags - see ProjectStatusDoneFlagWasChanged.
        project.doneFlagChangesSince(previous).ifPresent(this.eventBus::dispatch);

        // Re-seed the ticket-numbering counter from startingNumber on every settings save, but only
        // while no tickets exist yet - UpsertProjectPolicy already blocks startingNumber edits once
        // they do, so after the first ticket this is a no-op in practice, not just here defensively.
        if (project.getStartingNumber() != null && !this.ticketRepository.existsByProjectId(project.getId().value())) {
            this.repository.resetNextTicketNumber(project.getId(), project.getStartingNumber().value());
        }

        return null;
    }

    private Set<IssueType> toIssueTypes(List<IssueTypeRequest> issueTypeRequests) {
        if (issueTypeRequests == null) {
            return Collections.emptySet();
        }

        return issueTypeRequests.stream()
            .map(this::toIssueType)
            .collect(Collectors.toSet());
    }

    private IssueType toIssueType(IssueTypeRequest request) {
        return new IssueType(
            request.getId(),
            request.getName(),
            request.getColor(),
            request.isEstimable(),
            toWorkflow(request.getWorkflow()),
            request.getInitialStatusId(),
            request.getChildTypeIds(),
            request.getTitleTemplate(),
            request.getDescriptionTemplate()
        );
    }

    private Set<Status> toStatuses(List<StatusRequest> statusRequests) {
        if (statusRequests == null) {
            return Collections.emptySet();
        }

        return statusRequests.stream()
            .map(status -> new Status(
                status.getId(),
                status.getName(),
                status.getColor(),
                status.isDone()
            ))
            .collect(Collectors.toSet());
    }

    private Set<WorkflowStep> toWorkflow(List<WorkflowStepRequest> workflowStepRequests) {
        if (workflowStepRequests == null) {
            return Collections.emptySet();
        }

        return workflowStepRequests.stream()
            .map(step -> new WorkflowStep(step.getStatusId(), step.getAllowedTransitionIds()))
            .collect(Collectors.toSet());
    }

    private Set<AutomationRule> toAutomationRules(List<AutomationRuleRequest> automationRuleRequests) {
        if (automationRuleRequests == null) {
            return Collections.emptySet();
        }

        return automationRuleRequests.stream()
            .map(rule -> new AutomationRule(
                rule.getId(),
                rule.getParentTypeId(),
                rule.getSetParentStatusId()
            ))
            .collect(Collectors.toSet());
    }

    private Set<Flag> toFlags(List<FlagRequest> flagRequests) {
        if (flagRequests == null) {
            return Collections.emptySet();
        }

        return flagRequests.stream()
            .map(flag -> new Flag(
                flag.getId(),
                flag.getName(),
                flag.getColor()
            ))
            .collect(Collectors.toSet());
    }

    private Set<CustomFieldDefinition> toCustomFieldDefinitions(List<CustomFieldDefinitionRequest> customFieldDefinitionRequests) {
        if (customFieldDefinitionRequests == null) {
            return Collections.emptySet();
        }

        return customFieldDefinitionRequests.stream()
            .map(customFieldDefinition -> new CustomFieldDefinition(
                customFieldDefinition.getId(),
                customFieldDefinition.getName(),
                customFieldDefinition.getType() != null ? CustomFieldType.valueOf(customFieldDefinition.getType().toUpperCase()) : null,
                customFieldDefinition.getOptions(),
                customFieldDefinition.isMultiple()
            ))
            .collect(Collectors.toSet());
    }
}
