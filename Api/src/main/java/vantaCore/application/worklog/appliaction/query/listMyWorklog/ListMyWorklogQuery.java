package vantaCore.application.worklog.appliaction.query.listMyWorklog;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

// userIds empty = just the caller (self-scoped default, same as before this filter existed);
// non-empty = report for exactly those users - the frontend decides who the report is for, this
// no longer means "always me". Still gated by WORKLOG_VIEW like every other worklog read - that
// resource already implies "can see other users' logged time" today (a ticket's own worklog list
// already shows every contributor, not just the caller), so no new resource was needed for this.
@RequiresResource(Resource.WORKLOG_VIEW)
final public class ListMyWorklogQuery {

    @NotNull
    private final LocalDate startDate;

    @NotNull
    private final LocalDate endDate;

    private final Set<UUID> userIds;

    private final int page;
    private final int limit;

    public ListMyWorklogQuery(LocalDate startDate, LocalDate endDate, Set<UUID> userIds, int page, int limit) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.userIds = userIds == null ? Set.of() : Set.copyOf(userIds);
        this.page = page;
        this.limit = limit;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public Set<UUID> getUserIds() {
        return userIds;
    }

    public int getPage() {
        return page;
    }

    public int getLimit() {
        return limit;
    }
}
