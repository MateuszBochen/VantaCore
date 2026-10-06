package vantaCore.application.ticket.appliaction.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.Map;
import java.util.UUID;

final public class UpsertTicketRequest {

    private final UUID subProjectId;

    @NotNull
    private final UUID issueTypeId;

    @NotNull
    private final UUID statusId;

    private final UUID parentId;
    private final String title;
    private final String description;
    private final Integer priority;
    private final Double estimate;
    private final List<UUID> assigneeIds;
    private final List<UUID> flagIds;
    private final List<String> tags;
    private final Map<String, Object> customFields;
    private final List<RelatedTicketRequest> relatedTickets;

    public UpsertTicketRequest(
        UUID subProjectId,
        UUID issueTypeId,
        UUID statusId,
        UUID parentId,
        String title,
        String description,
        Integer priority,
        Double estimate,
        List<UUID> assigneeIds,
        List<UUID> flagIds,
        List<String> tags,
        Map<String, Object> customFields,
        List<RelatedTicketRequest> relatedTickets
    ) {
        this.subProjectId = subProjectId;
        this.issueTypeId = issueTypeId;
        this.statusId = statusId;
        this.parentId = parentId;
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.estimate = estimate;
        this.assigneeIds = assigneeIds;
        this.flagIds = flagIds;
        this.tags = tags;
        this.customFields = customFields;
        this.relatedTickets = relatedTickets;
    }

    public UUID getSubProjectId() {
        return subProjectId;
    }

    public UUID getIssueTypeId() {
        return issueTypeId;
    }

    public UUID getStatusId() {
        return statusId;
    }

    public UUID getParentId() {
        return parentId;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public Integer getPriority() {
        return priority;
    }

    public Double getEstimate() {
        return estimate;
    }

    public List<UUID> getAssigneeIds() {
        return assigneeIds;
    }

    public List<UUID> getFlagIds() {
        return flagIds;
    }

    public List<String> getTags() {
        return tags;
    }

    public Map<String, Object> getCustomFields() {
        return customFields;
    }

    public List<RelatedTicketRequest> getRelatedTickets() {
        return relatedTickets;
    }
}
