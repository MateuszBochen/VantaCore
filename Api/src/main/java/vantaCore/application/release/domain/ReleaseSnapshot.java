package vantaCore.application.release.domain;

import vantaCore.application.release.domain.vo.ReleaseId;
import vantaCore.application.release.domain.vo.ReleaseStatus;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

/** Read-only view of a ReleaseAggregate's state - the only way anything outside the aggregate gets
 at its fields, since ReleaseAggregate itself exposes no getters. */
public record ReleaseSnapshot(
    ReleaseId id,
    UUID projectId,
    LocalDate plannedReleaseDate,
    String afterCarePeriod,
    ReleaseStatus status,
    String versionNumber,
    String name,
    Set<UUID> ticketIds
) {
}
