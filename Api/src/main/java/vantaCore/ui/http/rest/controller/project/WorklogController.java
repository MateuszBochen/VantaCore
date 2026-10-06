package vantaCore.ui.http.rest.controller.project;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.application.worklog.appliaction.command.deleteWorklog.DeleteWorklogCommand;
import vantaCore.application.worklog.appliaction.command.logWorklog.LogWorklogCommand;
import vantaCore.application.worklog.appliaction.command.startWorklog.StartWorklogCommand;
import vantaCore.application.worklog.appliaction.command.updateWorklog.UpdateWorklogCommand;
import vantaCore.application.worklog.appliaction.dto.StartWorklogRequest;
import vantaCore.application.worklog.appliaction.dto.WorklogRequest;
import vantaCore.application.worklog.appliaction.query.listWorklog.ListWorklogQuery;
import vantaCore.application.worklog.appliaction.query.listWorklog.WorklogResult;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Empty;
import vantaCore.ui.http.rest.response.dto.Many;

import java.util.UUID;

@RestController
@RequestMapping("/api/project/{projectId}/ticket/{ticketId}/worklog")
final public class WorklogController {

    private final CommandBusInterface commandBus;
    private final QueryBusInterface queryBus;

    WorklogController(CommandBusInterface commandBus, QueryBusInterface queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }

    @PostMapping
    public OpenApiResponse<Empty> logWorklog(
        @PathVariable UUID projectId,
        @PathVariable UUID ticketId,
        @RequestBody WorklogRequest request
    ) throws Exception {

        this.commandBus.handle(new LogWorklogCommand(projectId, ticketId, request));

        return OpenApiResponse.empty(HttpStatus.CREATED);
    }

    @PutMapping("/{worklogId}")
    public OpenApiResponse<Empty> updateWorklog(
        @PathVariable UUID projectId,
        @PathVariable UUID ticketId,
        @PathVariable UUID worklogId,
        @RequestBody WorklogRequest request
    ) throws Exception {

        this.commandBus.handle(new UpdateWorklogCommand(projectId, ticketId, worklogId, request));

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    @DeleteMapping("/{worklogId}")
    public OpenApiResponse<Empty> deleteWorklog(
        @PathVariable UUID projectId,
        @PathVariable UUID ticketId,
        @PathVariable UUID worklogId
    ) throws Exception {

        this.commandBus.handle(new DeleteWorklogCommand(projectId, ticketId, worklogId));

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    @GetMapping
    public OpenApiResponse<Many<WorklogResult>> listWorklog(
        @PathVariable UUID projectId,
        @PathVariable UUID ticketId
    ) throws Exception {

        Collection<WorklogResult> result = this.queryBus.ask(new ListWorklogQuery(projectId, ticketId));

        return OpenApiResponse.many(result, HttpStatus.OK);
    }

    @PostMapping("/start")
    public OpenApiResponse<Empty> startWorklog(
        @PathVariable UUID projectId,
        @PathVariable UUID ticketId,
        @RequestBody StartWorklogRequest request
    ) throws Exception {

        this.commandBus.handle(new StartWorklogCommand(projectId, ticketId, request));

        return OpenApiResponse.empty(HttpStatus.OK);
    }
}
