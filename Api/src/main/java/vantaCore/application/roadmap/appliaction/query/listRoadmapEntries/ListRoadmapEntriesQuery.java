package vantaCore.application.roadmap.appliaction.query.listRoadmapEntries;

import jakarta.validation.constraints.Min;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.time.LocalDate;

// Reuses RELEASE_VIEW - this is a read view over Version Tracker's own releases (see
// Resource.java's own comment on roadmap:*), not a resource of its own.
@RequiresResource(Resource.RELEASE_VIEW)
final public class ListRoadmapEntriesQuery {

    @Min(0)
    private final int page;

    @Min(1)
    private final int limit;

    // Both optional - filter on plannedReleaseDate, inclusive on both ends. Null means unbounded
    // on that side (see JpaReleaseRepositoryAdapter.findPage).
    private final LocalDate from;
    private final LocalDate till;

    public ListRoadmapEntriesQuery(int page, int limit, LocalDate from, LocalDate till) {
        this.page = page;
        this.limit = limit;
        this.from = from;
        this.till = till;
    }

    public int getPage() {
        return page;
    }

    public int getLimit() {
        return limit;
    }

    public LocalDate getFrom() {
        return from;
    }

    public LocalDate getTill() {
        return till;
    }
}
