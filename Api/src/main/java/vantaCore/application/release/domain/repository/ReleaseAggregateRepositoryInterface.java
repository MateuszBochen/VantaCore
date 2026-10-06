package vantaCore.application.release.domain.repository;

import vantaCore.application.release.domain.ReleaseAggregate;
import vantaCore.application.release.domain.vo.ReleaseId;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReleaseAggregateRepositoryInterface {

    /** saving aggregate (create or full replace) */
    void save(ReleaseAggregate release);

    Optional<ReleaseAggregate> findById(ReleaseId id);

    /** newest plannedReleaseDate first - unpaginated, used for cross-release checks (e.g. version
     uniqueness) where the whole project's releases need to be considered at once. */
    List<ReleaseAggregate> findAllByProjectId(UUID projectId);

    /** Paginated (0-indexed page, page size = limit), newest plannedReleaseDate first. */
    ReleasePage findPageByProjectId(UUID projectId, int page, int limit);

    /** Same as findPageByProjectId but across every project - backs GET /api/roadmap-entry (a
     cross-project view over Version Tracker's own releases, see the sub-project's own ADR for why
     it isn't a separate write model). from/till filter on plannedReleaseDate, inclusive on both
     ends - either or both may be null (unbounded on that side). */
    ReleasePage findPage(int page, int limit, LocalDate from, LocalDate till);

    /** Atomically adds one ticket id to a release's ticketIds, bypassing save()/changeRelease()'s
     full-collection replace - a no-op (not an error) if the ticket is already in the release. Exists
     specifically so a concurrent writer (e.g. AssignTicketToReleaseVersionCommandHandler racing a
     human editing the same release in the Version Tracker UI) can't lose an update the way two
     overlapping full-object save() calls could. NOTE: this doesn't fully close the race against a
     concurrent full PUT (UpsertReleaseCommandHandler) - that path still overwrites ticketIds
     wholesale from whatever it read, so it can still clobber an add made here after its own read
     but before its own write. ReleaseEntity has no optimistic-lock version column to prevent that
     today. */
    void addTicket(ReleaseId releaseId, UUID ticketId);

    record ReleasePage(List<ReleaseAggregate> items, long total) {
    }
}
