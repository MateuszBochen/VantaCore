package vantaCore.application.release.appliaction.dto;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

final public class UpsertReleaseRequest {

    // Optional - null (client sends '') until a date is picked. See EmptyableLocalDateDeserializer.
    @JsonDeserialize(using = EmptyableLocalDateDeserializer.class)
    private final LocalDate plannedReleaseDate;

    // Optional planned post-release "after care" window - an ISO-8601 duration string from a fixed
    // client-side list (P1D..P6D, P1W, P2W, P1M, P2M), or '' / null when none is planned. Stored
    // verbatim; not validated against the list so an unrecognised value coming back stays visible.
    @Size(max = 255)
    private final String afterCarePeriod;

    @NotBlank
    private final String status;

    @NotBlank
    @Size(max = 255)
    private final String versionNumber;

    @NotBlank
    @Size(max = 255)
    private final String name;

    private final List<UUID> ticketIds;

    public UpsertReleaseRequest(LocalDate plannedReleaseDate, String afterCarePeriod, String status, String versionNumber, String name, List<UUID> ticketIds) {
        this.plannedReleaseDate = plannedReleaseDate;
        this.afterCarePeriod = afterCarePeriod;
        this.status = status;
        this.versionNumber = versionNumber;
        this.name = name;
        this.ticketIds = ticketIds;
    }

    public LocalDate getPlannedReleaseDate() {
        return plannedReleaseDate;
    }

    public String getAfterCarePeriod() {
        return afterCarePeriod;
    }

    public String getStatus() {
        return status;
    }

    public String getVersionNumber() {
        return versionNumber;
    }

    public String getName() {
        return name;
    }

    public List<UUID> getTicketIds() {
        return ticketIds;
    }
}
