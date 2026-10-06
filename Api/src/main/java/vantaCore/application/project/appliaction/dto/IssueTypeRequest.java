package vantaCore.application.project.appliaction.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Set;
import java.util.UUID;

final public class IssueTypeRequest {

    @NotNull
    private final UUID id;
    private final String name;
    private final String color;
    private final boolean estimable;

    @Valid
    private final List<WorkflowStepRequest> workflow;

    private final UUID initialStatusId;
    private final Set<UUID> childTypeIds;
    private final String titleTemplate;
    private final String descriptionTemplate;

    public IssueTypeRequest(
        UUID id,
        String name,
        String color,
        boolean estimable,
        List<WorkflowStepRequest> workflow,
        UUID initialStatusId,
        Set<UUID> childTypeIds,
        String titleTemplate,
        String descriptionTemplate
    ) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.estimable = estimable;
        this.workflow = workflow;
        this.initialStatusId = initialStatusId;
        this.childTypeIds = childTypeIds;
        this.titleTemplate = titleTemplate;
        this.descriptionTemplate = descriptionTemplate;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getColor() {
        return color;
    }

    public boolean isEstimable() {
        return estimable;
    }

    public List<WorkflowStepRequest> getWorkflow() {
        return workflow;
    }

    public UUID getInitialStatusId() {
        return initialStatusId;
    }

    public Set<UUID> getChildTypeIds() {
        return childTypeIds;
    }

    public String getTitleTemplate() {
        return titleTemplate;
    }

    public String getDescriptionTemplate() {
        return descriptionTemplate;
    }
}
