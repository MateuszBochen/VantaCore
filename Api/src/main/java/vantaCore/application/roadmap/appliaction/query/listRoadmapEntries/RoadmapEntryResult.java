package vantaCore.application.roadmap.appliaction.query.listRoadmapEntries;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** One release/version (see ReleaseResult, which this deliberately doesn't reuse) with its
 assigned tickets trimmed down to just what a roadmap view needs (id/statusId/title/key) rather
 than the full GetTicketResult - this endpoint returns every version across every project in one
 call, so a heavier per-ticket payload would multiply out fast. */
public record RoadmapEntryResult(
    UUID versionId,
    UUID projectId,
    LocalDate plannedReleaseDate,
    String afterCarePeriod,
    String status,
    String versionNumber,
    String name,
    List<RoadmapTicketResult> tickets
) {

    public record RoadmapTicketResult(UUID id, UUID statusId, String title, String key) {
    }
}
