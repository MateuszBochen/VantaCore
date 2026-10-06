package vantaCore.ui.http.rest.controller.board;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.application.sprint.appliaction.command.closeSprint.CloseSprintCommand;
import vantaCore.application.sprint.appliaction.command.startSprint.StartSprintCommand;
import vantaCore.application.sprint.appliaction.command.updateSprintTicket.UpdateSprintTicketCommand;
import vantaCore.application.sprint.appliaction.command.upsertSprint.UpsertSprintCommand;
import vantaCore.application.sprint.appliaction.dto.UpdateSprintTicketRequest;
import vantaCore.application.sprint.appliaction.dto.UpsertSprintRequest;
import vantaCore.application.sprint.appliaction.query.getSprintReport.GetSprintReportQuery;
import vantaCore.application.sprint.appliaction.query.getSprintReport.SprintReportResult;
import vantaCore.application.sprint.appliaction.query.listSprints.ListSprintsQuery;
import vantaCore.application.sprint.appliaction.query.listSprints.SprintResult;
import vantaCore.application.shared.application.query.Item;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Empty;
import vantaCore.ui.http.rest.response.dto.Many;
import vantaCore.ui.http.rest.response.dto.Single;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/board/{boardId}/sprint")
final public class SprintController {

    private final CommandBusInterface commandBus;
    private final QueryBusInterface queryBus;

    SprintController(CommandBusInterface commandBus, QueryBusInterface queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }

    @PutMapping("/{sprintId}")
    public OpenApiResponse<Empty> upsertSprint(
        @PathVariable UUID boardId,
        @PathVariable UUID sprintId,
        @RequestBody UpsertSprintRequest request
    ) throws Exception {

        this.commandBus.handle(new UpsertSprintCommand(boardId, sprintId, request));

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    @PatchMapping("/{sprintId}")
    public OpenApiResponse<Empty> updateSprintTicket(
        @PathVariable UUID boardId,
        @PathVariable UUID sprintId,
        @RequestBody UpdateSprintTicketRequest request
    ) throws Exception {

        this.commandBus.handle(new UpdateSprintTicketCommand(boardId, sprintId, request));

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    @PostMapping("/{sprintId}/start")
    public OpenApiResponse<Empty> startSprint(
        @PathVariable UUID boardId,
        @PathVariable UUID sprintId
    ) throws Exception {

        this.commandBus.handle(new StartSprintCommand(boardId, sprintId));

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    @PostMapping("/{sprintId}/close")
    public OpenApiResponse<Empty> closeSprint(
        @PathVariable UUID boardId,
        @PathVariable UUID sprintId
    ) throws Exception {

        this.commandBus.handle(new CloseSprintCommand(boardId, sprintId));

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    @GetMapping("/{sprintId}/report")
    public OpenApiResponse<Single<SprintReportResult>> getSprintReport(
        @PathVariable UUID boardId,
        @PathVariable UUID sprintId
    ) throws Exception {

        Item<SprintReportResult> result = this.queryBus.ask(new GetSprintReportQuery(boardId, sprintId));

        return OpenApiResponse.one(result, HttpStatus.OK);
    }

    @GetMapping
    public OpenApiResponse<Many<SprintResult>> listSprints(
        @PathVariable UUID boardId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate till
    ) throws Exception {

        Collection<SprintResult> result = this.queryBus.ask(new ListSprintsQuery(boardId, from, till));

        return OpenApiResponse.many(result, HttpStatus.OK);
    }
}
