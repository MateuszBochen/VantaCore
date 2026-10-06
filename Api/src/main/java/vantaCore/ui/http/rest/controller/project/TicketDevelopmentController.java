package vantaCore.ui.http.rest.controller.project;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.application.vcs.appliaction.query.getDevelopmentActivity.DevelopmentActivityResult;
import vantaCore.application.vcs.appliaction.query.getDevelopmentActivity.GetDevelopmentActivityQuery;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Single;

import java.util.UUID;

@RestController
@RequestMapping("/api/project/{projectId}/ticket/{ticketId}/development")
final public class TicketDevelopmentController {

    private final QueryBusInterface queryBus;

    TicketDevelopmentController(QueryBusInterface queryBus) {
        this.queryBus = queryBus;
    }

    @GetMapping
    public OpenApiResponse<Single<DevelopmentActivityResult>> getDevelopmentActivity(
        @PathVariable UUID projectId,
        @PathVariable UUID ticketId
    ) throws Exception {

        Item<DevelopmentActivityResult> result = this.queryBus.ask(new GetDevelopmentActivityQuery(projectId, ticketId));

        return OpenApiResponse.one(result, HttpStatus.OK);
    }
}
