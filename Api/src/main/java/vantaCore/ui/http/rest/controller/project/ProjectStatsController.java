package vantaCore.ui.http.rest.controller.project;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.application.ticket.appliaction.query.getProjectStats.GetProjectStatsQuery;
import vantaCore.application.ticket.appliaction.query.getProjectStats.ProjectStatsResult;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Single;

import java.util.UUID;

@RestController
@RequestMapping("/api/project/{projectId}/stats")
final public class ProjectStatsController {

    private final QueryBusInterface queryBus;

    ProjectStatsController(QueryBusInterface queryBus) {
        this.queryBus = queryBus;
    }

    @GetMapping
    public OpenApiResponse<Single<ProjectStatsResult>> getProjectStats(@PathVariable UUID projectId) throws Exception {
        Item<ProjectStatsResult> result = this.queryBus.ask(new GetProjectStatsQuery(projectId));

        return OpenApiResponse.one(result, HttpStatus.OK);
    }
}
