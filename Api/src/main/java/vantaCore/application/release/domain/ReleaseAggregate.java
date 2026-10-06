package vantaCore.application.release.domain;

import vantaCore.application.release.domain.vo.ReleaseId;
import vantaCore.application.release.domain.vo.ReleaseStatus;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

public class ReleaseAggregate {
    private final ReleaseId id;
    private final UUID projectId;
    private final LocalDate plannedReleaseDate;
    /** ISO-8601 duration string (e.g. "P2W") for the planned post-release after-care window, or
     null when none is planned. Kept as the raw string the client sent - see UpsertReleaseRequest. */
    private final String afterCarePeriod;
    private final ReleaseStatus status;
    private final String versionNumber;
    private final String name;
    private final Set<UUID> ticketIds;

    private ReleaseAggregate(
        ReleaseId id,
        UUID projectId,
        LocalDate plannedReleaseDate,
        String afterCarePeriod,
        ReleaseStatus status,
        String versionNumber,
        String name,
        Set<UUID> ticketIds
    ) {
        this.id = id;
        this.projectId = projectId;
        this.plannedReleaseDate = plannedReleaseDate;
        this.afterCarePeriod = afterCarePeriod;
        this.status = status;
        this.versionNumber = versionNumber;
        this.name = name;
        this.ticketIds = ticketIds == null ? Set.of() : Set.copyOf(ticketIds);
    }

    /** A brand-new release - also used to rebuild one from storage, since every field is supplied
     either way. */
    public static ReleaseAggregate newRelease(
        ReleaseId id,
        UUID projectId,
        LocalDate plannedReleaseDate,
        String afterCarePeriod,
        ReleaseStatus status,
        String versionNumber,
        String name,
        Set<UUID> ticketIds
    ) {
        return new ReleaseAggregate(id, projectId, plannedReleaseDate, afterCarePeriod, status, versionNumber, name, ticketIds);
    }

    /** Replaces this release's editable fields - id/projectId are fixed for the release's lifetime
     and always carry over from the current instance, never from the caller. */
    public ReleaseAggregate changeRelease(
        LocalDate plannedReleaseDate,
        String afterCarePeriod,
        ReleaseStatus status,
        String versionNumber,
        String name,
        Set<UUID> ticketIds
    ) {
        return new ReleaseAggregate(this.id, this.projectId, plannedReleaseDate, afterCarePeriod, status, versionNumber, name, ticketIds);
    }

    public ReleaseSnapshot toSnapshot() {
        return new ReleaseSnapshot(id, projectId, plannedReleaseDate, afterCarePeriod, status, versionNumber, name, ticketIds);
    }
}
