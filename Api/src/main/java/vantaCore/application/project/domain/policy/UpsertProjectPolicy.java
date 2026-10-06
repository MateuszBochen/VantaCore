package vantaCore.application.project.domain.policy;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.AutomationRule;
import vantaCore.application.project.domain.vo.IssueType;
import vantaCore.application.project.domain.vo.Status;
import vantaCore.application.project.domain.vo.WorkflowStep;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.dto.NotificationCollection;
import vantaCore.application.shared.domain.policy.PolicyInterface;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;

import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
final public class UpsertProjectPolicy implements PolicyInterface<ProjectAggregate> {

    private final ProjectAggregateRepositoryInterface projectAggregateRepository;
    private final TicketAggregateRepositoryInterface ticketAggregateRepository;

    public UpsertProjectPolicy(
        ProjectAggregateRepositoryInterface projectAggregateRepository,
        TicketAggregateRepositoryInterface ticketAggregateRepository
    ) {
        this.projectAggregateRepository = projectAggregateRepository;
        this.ticketAggregateRepository = ticketAggregateRepository;
    }

    @Override
    public NotificationCollection check(ProjectAggregate project) {
        NotificationCollection notificationCollection = new NotificationCollection();

        if (project.getName() != null
            && this.projectAggregateRepository.existsByNameIgnoreCaseAndIdNot(project.getName(), project.getId())) {
            notificationCollection.append(new Notification(
                "project-name-taken",
                "Project with same name already exist",
                true
            ));
        }

        if (project.getPrefix() != null
            && this.projectAggregateRepository.existsByPrefixIgnoreCaseAndIdNot(project.getPrefix(), project.getId())) {
            notificationCollection.append(new Notification(
                "project-prefix-taken",
                "Project with same prefix already exist",
                true
            ));
        }

        this.checkIntegrity(project, notificationCollection);
        this.checkNumberingLock(project, notificationCollection);

        return notificationCollection;
    }

    // Once a project has tickets, prefix/startingNumber together define the {prefix}-{number} scheme
    // those tickets were already numbered under - changing either afterwards would either collide
    // with existing keys (prefix) or silently stop meaning anything (startingNumber, since the live
    // counter has already moved past it).
    private void checkNumberingLock(ProjectAggregate project, NotificationCollection notificationCollection) {
        if (!this.ticketAggregateRepository.existsByProjectId(project.getId().value())) {
            return;
        }

        ProjectAggregate existing = this.projectAggregateRepository.findById(project.getId()).orElse(null);

        if (existing == null) {
            return;
        }

        if (!Objects.equals(existing.getPrefix(), project.getPrefix())) {
            notificationCollection.append(new Notification(
                "project-prefix-locked",
                "Prefix can no longer be changed once the project has tickets",
                true
            ));
        }

        if (!Objects.equals(existing.getStartingNumber(), project.getStartingNumber())) {
            notificationCollection.append(new Notification(
                "project-starting-number-locked",
                "Starting number can no longer be changed once the project has tickets",
                true
            ));
        }
    }

    private void checkIntegrity(ProjectAggregate project, NotificationCollection notificationCollection) {
        checkDuplicateStatusIds(project, notificationCollection);

        Set<UUID> issueTypeIds = project.getIssueTypes().stream()
            .map(IssueType::id)
            .collect(Collectors.toSet());

        Set<UUID> poolStatusIds = project.getStatuses().stream()
            .map(Status::id)
            .collect(Collectors.toSet());

        for (IssueType issueType : project.getIssueTypes()) {
            Set<UUID> workflowStatusIds = issueType.workflow().stream()
                .map(WorkflowStep::statusId)
                .collect(Collectors.toSet());

            for (WorkflowStep step : issueType.workflow()) {
                if (!poolStatusIds.contains(step.statusId())) {
                    notificationCollection.append(new Notification(
                        "invalid-workflow-status",
                        "Issue type '" + issueType.name() + "' references a status that does not exist in this project's status pool",
                        true
                    ));
                }

                for (UUID transitionId : step.allowedTransitionIds()) {
                    if (!workflowStatusIds.contains(transitionId)) {
                        notificationCollection.append(new Notification(
                            "invalid-status-transition",
                            "A status in issue type '" + issueType.name() + "' has a transition to a status not used by its own workflow",
                            true
                        ));
                    }
                }
            }

            if (issueType.initialStatusId() != null && !workflowStatusIds.contains(issueType.initialStatusId())) {
                notificationCollection.append(new Notification(
                    "invalid-initial-status",
                    "Issue type '" + issueType.name() + "' has an initial status that its own workflow does not use",
                    true
                ));
            }

            for (UUID childTypeId : issueType.childTypeIds()) {
                if (!issueTypeIds.contains(childTypeId)) {
                    notificationCollection.append(new Notification(
                        "invalid-child-type",
                        "Issue type '" + issueType.name() + "' references a child issue type that does not exist in this project",
                        true
                    ));
                }
            }
        }

        Map<UUID, IssueType> issueTypesById = project.getIssueTypes().stream()
            .collect(Collectors.toMap(IssueType::id, issueType -> issueType));

        for (AutomationRule rule : project.getAutomationRules()) {
            if (rule.parentTypeId() == null) {
                continue;
            }

            IssueType parentType = issueTypesById.get(rule.parentTypeId());

            if (parentType == null) {
                notificationCollection.append(new Notification(
                    "invalid-automation-parent-type",
                    "Automation rule references an issue type that does not exist in this project",
                    true
                ));
                continue;
            }

            if (rule.setParentStatusId() == null) {
                continue;
            }

            boolean statusBelongsToParent = parentType.workflow().stream()
                .anyMatch(step -> step.statusId().equals(rule.setParentStatusId()));

            if (!statusBelongsToParent) {
                notificationCollection.append(new Notification(
                    "invalid-automation-status",
                    "Automation rule sets a status that its parent issue type's own workflow does not use",
                    true
                ));
            }
        }
    }

    // Set<Status> doesn't dedupe by id alone (record equality is over every field), so two entries
    // sharing an id but differing in e.g. name would otherwise both survive silently - a real
    // correctness bug now that a status's id is the thing referenced everywhere (tickets, workflow
    // steps, board columns, automation rules), unlike a plain project-settings collection.
    private void checkDuplicateStatusIds(ProjectAggregate project, NotificationCollection notificationCollection) {
        Set<UUID> seen = new HashSet<>();

        for (Status status : project.getStatuses()) {
            if (!seen.add(status.id())) {
                notificationCollection.append(new Notification(
                    "duplicate-status-id",
                    "Project has more than one status with the same id",
                    true
                ));
            }
        }
    }
}
