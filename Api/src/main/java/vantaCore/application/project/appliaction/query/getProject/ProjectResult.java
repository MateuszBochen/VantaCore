package vantaCore.application.project.appliaction.query.getProject;

import java.util.Set;
import java.util.UUID;

public record ProjectResult(
    UUID id,
    String name,
    String prefix,
    Integer startingNumber,
    String estimateUnit,
    Set<StatusResult> statuses,
    Set<IssueTypeResult> issueTypes,
    Set<AutomationRuleResult> automationRules,
    Set<FlagResult> flags,
    Set<CustomFieldDefinitionResult> customFieldDefinitions
) {
}
