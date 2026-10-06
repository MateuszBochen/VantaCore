package vantaCore.application.project.domain;

import vantaCore.application.project.domain.event.ProjectStatusDoneFlagWasChanged;
import vantaCore.application.project.domain.vo.AutomationRule;
import vantaCore.application.project.domain.vo.CustomFieldDefinition;
import vantaCore.application.project.domain.vo.Flag;
import vantaCore.application.project.domain.vo.IssueType;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.project.domain.vo.ProjectName;
import vantaCore.application.project.domain.vo.ProjectPrefix;
import vantaCore.application.project.domain.vo.StartingNumber;
import vantaCore.application.project.domain.vo.Status;
import vantaCore.application.project.domain.vo.WorkflowStep;

import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public class ProjectAggregate {
    private final ProjectId id;
    private final ProjectName name;
    private final ProjectPrefix prefix;
    private final StartingNumber startingNumber;
    private final String estimateUnit;
    private final Set<Status> statuses;
    private final Set<IssueType> issueTypes;
    private final Set<AutomationRule> automationRules;
    private final Set<Flag> flags;
    private final Set<CustomFieldDefinition> customFieldDefinitions;

    public ProjectAggregate(
        ProjectId id,
        ProjectName name,
        ProjectPrefix prefix,
        StartingNumber startingNumber,
        String estimateUnit,
        Set<Status> statuses,
        Set<IssueType> issueTypes,
        Set<AutomationRule> automationRules,
        Set<Flag> flags,
        Set<CustomFieldDefinition> customFieldDefinitions
    ) {
        this.id = id;
        this.name = name;
        this.prefix = prefix;
        this.startingNumber = startingNumber;
        this.estimateUnit = estimateUnit;
        this.statuses = statuses == null ? Set.of() : Set.copyOf(statuses);
        this.issueTypes = issueTypes == null ? Set.of() : Set.copyOf(issueTypes);
        this.automationRules = automationRules == null ? Set.of() : Set.copyOf(automationRules);
        this.flags = flags == null ? Set.of() : Set.copyOf(flags);
        this.customFieldDefinitions = customFieldDefinitions == null ? Set.of() : Set.copyOf(customFieldDefinitions);
    }

    public ProjectId getId() {
        return id;
    }

    public ProjectName getName() {
        return name;
    }

    public ProjectPrefix getPrefix() {
        return prefix;
    }

    public StartingNumber getStartingNumber() {
        return startingNumber;
    }

    public String getEstimateUnit() {
        return estimateUnit;
    }

    public Set<Status> getStatuses() {
        return statuses;
    }

    public Set<IssueType> getIssueTypes() {
        return issueTypes;
    }

    public Set<AutomationRule> getAutomationRules() {
        return automationRules;
    }

    public Set<Flag> getFlags() {
        return flags;
    }

    public Set<CustomFieldDefinition> getCustomFieldDefinitions() {
        return customFieldDefinitions;
    }

    /** True if statusId is configured as "done" in the shared pool - a flat lookup now that Status
     identity is project-level, not per issue type (used by both the ticket-completion automation,
     PropagateAutomationCommandHandler, and sprint burndown, SprintEstimateCalculator). */
    public boolean isStatusDone(UUID statusId) {
        return this.statuses.stream()
            .filter(status -> status.id().equals(statusId))
            .findFirst()
            .map(Status::isDone)
            .orElse(false);
    }

    /** The first status this issue type's OWN workflow uses that's also configured as "done" in the
     shared pool, if any - unlike isStatusDone, this still needs issueTypeId, since which statuses
     even apply to a given type is workflow-scoped, not just pool-wide. */
    public Optional<UUID> findDoneStatusId(UUID issueTypeId) {
        return this.issueTypes.stream()
            .filter(issueType -> issueType.id().equals(issueTypeId))
            .flatMap(issueType -> issueType.workflow().stream())
            .map(WorkflowStep::statusId)
            .filter(this::isStatusDone)
            .findFirst();
    }

    /** Case-insensitive, whitespace-trimmed name match - used by import as a fallback when a raw
     source value (e.g. Azure DevOps' "Bug") has no explicit value mapping. */
    public Optional<UUID> findIssueTypeIdByName(String name) {
        return this.issueTypes.stream()
            .filter(issueType -> namesMatch(issueType.name(), name))
            .map(IssueType::id)
            .findFirst();
    }

    /** Same matching rule as findIssueTypeIdByName, over the shared status pool. */
    public Optional<UUID> findStatusIdByName(String name) {
        return this.statuses.stream()
            .filter(status -> namesMatch(status.name(), name))
            .map(Status::id)
            .findFirst();
    }

    /** The issue type's configured initial status, if it has one. */
    public Optional<UUID> findInitialStatusId(UUID issueTypeId) {
        return this.issueTypes.stream()
            .filter(issueType -> issueType.id().equals(issueTypeId))
            .map(IssueType::initialStatusId)
            .filter(Objects::nonNull)
            .findFirst();
    }

    private static boolean namesMatch(String left, String right) {
        return left != null && right != null && left.trim().equalsIgnoreCase(right.trim());
    }

    /** Statuses present in BOTH this and `previous` whose isDone differs - the ones whose tickets
     silently changed done-state with this save. Added/removed statuses aren't included - a brand-new
     status has no tickets in it yet, and there's no "previous" flag to compare a removed one to.
     Empty when there's no previous version (first save of the project). */
    public Optional<ProjectStatusDoneFlagWasChanged> doneFlagChangesSince(ProjectAggregate previous) {
        if (previous == null) {
            return Optional.empty();
        }

        Map<UUID, Boolean> previousDone = previous.statuses.stream()
            .collect(Collectors.toMap(Status::id, Status::isDone));

        Set<UUID> becameDone = new HashSet<>();
        Set<UUID> becameNotDone = new HashSet<>();
        for (Status status : this.statuses) {
            Boolean wasDone = previousDone.get(status.id());
            if (wasDone == null || wasDone == status.isDone()) {
                continue;
            }
            (status.isDone() ? becameDone : becameNotDone).add(status.id());
        }

        if (becameDone.isEmpty() && becameNotDone.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(new ProjectStatusDoneFlagWasChanged(this.id.value(), becameDone, becameNotDone));
    }

    /** The "auto-set status when all children are done" rule configured for a parent of this issue
     type, if any - see AutomationRule. */
    public Optional<AutomationRule> findAutomationRuleForParentType(UUID parentIssueTypeId) {
        return this.automationRules.stream()
            .filter(rule -> rule.parentTypeId().equals(parentIssueTypeId))
            .findFirst();
    }
}
