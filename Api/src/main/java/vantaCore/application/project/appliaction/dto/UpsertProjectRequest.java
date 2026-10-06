package vantaCore.application.project.appliaction.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

final public class UpsertProjectRequest {

    @Size(max = 255)
    private final String name;

    @Pattern(regexp = "^[A-Z][A-Z0-9]{1,9}$", message = "prefix must be 2-10 uppercase letters/digits, starting with a letter")
    private final String prefix;

    @Min(1)
    private final Integer startingNumber;

    @Size(max = 255)
    private final String estimateUnit;

    @Valid
    private final List<StatusRequest> statuses;

    @Valid
    private final List<IssueTypeRequest> issueTypes;

    @Valid
    private final List<AutomationRuleRequest> automationRules;

    @Valid
    private final List<FlagRequest> flags;

    @Valid
    private final List<CustomFieldDefinitionRequest> customFieldDefinitions;

    public UpsertProjectRequest(
        String name,
        String prefix,
        Integer startingNumber,
        String estimateUnit,
        List<StatusRequest> statuses,
        List<IssueTypeRequest> issueTypes,
        List<AutomationRuleRequest> automationRules,
        List<FlagRequest> flags,
        List<CustomFieldDefinitionRequest> customFieldDefinitions
    ) {
        this.name = name;
        this.prefix = prefix;
        this.startingNumber = startingNumber;
        this.estimateUnit = estimateUnit;
        this.statuses = statuses;
        this.issueTypes = issueTypes;
        this.automationRules = automationRules;
        this.flags = flags;
        this.customFieldDefinitions = customFieldDefinitions;
    }

    public String getName() {
        return name;
    }

    public String getPrefix() {
        return prefix;
    }

    public Integer getStartingNumber() {
        return startingNumber;
    }

    public String getEstimateUnit() {
        return estimateUnit;
    }

    public List<StatusRequest> getStatuses() {
        return statuses;
    }

    public List<IssueTypeRequest> getIssueTypes() {
        return issueTypes;
    }

    public List<AutomationRuleRequest> getAutomationRules() {
        return automationRules;
    }

    public List<FlagRequest> getFlags() {
        return flags;
    }

    public List<CustomFieldDefinitionRequest> getCustomFieldDefinitions() {
        return customFieldDefinitions;
    }
}
