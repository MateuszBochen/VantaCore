package vantaCore.application.release.appliaction.query.listReleases;

import vantaCore.application.ticket.appliaction.query.getTicket.GetTicketResult;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ReleaseResult(
    UUID versionId,
    UUID projectId,
    LocalDate plannedReleaseDate,
    String afterCarePeriod,
    String status,
    String versionNumber,
    String name,
    List<GetTicketResult> tickets
) {
}
