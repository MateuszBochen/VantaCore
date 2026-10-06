package vantaCore.application.board.appliaction.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

final public class CreateBoardRequest {

    @NotNull
    private final UUID id;

    @NotBlank
    @Size(max = 255)
    private final String name;

    private final List<UUID> projectIds;

    @Valid
    private final List<ColumnRequest> columns;

    private final boolean allowEditTicketInActiveSprint;
    private final boolean allowChangeEstimateInActiveSprint;
    private final boolean allowAddTicketToActiveSprint;
    private final boolean allowRemoveTicketFromActiveSprint;

    public CreateBoardRequest(
        UUID id,
        String name,
        List<UUID> projectIds,
        List<ColumnRequest> columns,
        boolean allowEditTicketInActiveSprint,
        boolean allowChangeEstimateInActiveSprint,
        boolean allowAddTicketToActiveSprint,
        boolean allowRemoveTicketFromActiveSprint
    ) {
        this.id = id;
        this.name = name;
        this.projectIds = projectIds;
        this.columns = columns;
        this.allowEditTicketInActiveSprint = allowEditTicketInActiveSprint;
        this.allowChangeEstimateInActiveSprint = allowChangeEstimateInActiveSprint;
        this.allowAddTicketToActiveSprint = allowAddTicketToActiveSprint;
        this.allowRemoveTicketFromActiveSprint = allowRemoveTicketFromActiveSprint;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public List<UUID> getProjectIds() {
        return projectIds;
    }

    public List<ColumnRequest> getColumns() {
        return columns;
    }

    public boolean isAllowEditTicketInActiveSprint() {
        return allowEditTicketInActiveSprint;
    }

    public boolean isAllowChangeEstimateInActiveSprint() {
        return allowChangeEstimateInActiveSprint;
    }

    public boolean isAllowAddTicketToActiveSprint() {
        return allowAddTicketToActiveSprint;
    }

    public boolean isAllowRemoveTicketFromActiveSprint() {
        return allowRemoveTicketFromActiveSprint;
    }
}
