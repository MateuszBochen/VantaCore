package vantaCore.ui.http.rest.controller.roadmap;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.roadmap.appliaction.query.listRoadmapEntries.ListRoadmapEntriesQuery;
import vantaCore.application.roadmap.appliaction.query.listRoadmapEntries.RoadmapEntryResult;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Many;

import java.time.LocalDate;

// Read-only, cross-project view over Version Tracker's own releases (see ReleaseAggregate) -
// there's no separate roadmap write model, adding/replanning tickets on a version still goes
// through the existing PUT /api/project/{projectId}/release / AssignTicketToReleaseVersionCommand.
@RestController
@RequestMapping("/api/roadmap-entry")
final public class RoadmapEntryController {

    private final QueryBusInterface queryBus;

    RoadmapEntryController(QueryBusInterface queryBus) {
        this.queryBus = queryBus;
    }

    @GetMapping
    public OpenApiResponse<Many<RoadmapEntryResult>> listRoadmapEntries(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "100") int limit,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate till
    ) throws Exception {

        Collection<RoadmapEntryResult> result = this.queryBus.ask(new ListRoadmapEntriesQuery(page, limit, from, till));

        return OpenApiResponse.many(result, HttpStatus.OK);
    }
}
