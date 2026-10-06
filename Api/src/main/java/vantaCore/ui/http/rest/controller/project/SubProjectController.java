package vantaCore.ui.http.rest.controller.project;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.application.subProject.appliaction.command.deploySubProject.DeploySubProjectCommand;
import vantaCore.application.subProject.appliaction.command.upsertSubProject.UpsertSubProjectCommand;
import vantaCore.application.subProject.appliaction.dto.UpsertSubProjectRequest;
import vantaCore.application.subProject.appliaction.query.getPreviousSubProjectVersion.GetPreviousSubProjectVersionQuery;
import vantaCore.application.subProject.appliaction.query.getSubProject.GetSubProjectQuery;
import vantaCore.application.subProject.appliaction.query.listSubProjects.ListSubProjectsQuery;
import vantaCore.application.subProject.appliaction.query.listSubProjects.SubProjectSummaryResult;
import vantaCore.application.subProject.appliaction.query.result.SubProjectResult;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Empty;
import vantaCore.ui.http.rest.response.dto.Many;
import vantaCore.ui.http.rest.response.dto.Single;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/project/{projectId}/sub-project")
final public class SubProjectController {

    private final CommandBusInterface commandBus;
    private final QueryBusInterface queryBus;

    SubProjectController(CommandBusInterface commandBus, QueryBusInterface queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }

    @GetMapping
    public OpenApiResponse<Many<SubProjectSummaryResult>> listSubProjects(
        @PathVariable UUID projectId
    ) throws Exception {

        ListSubProjectsQuery query = new ListSubProjectsQuery(projectId);
        Collection<SubProjectSummaryResult> result = this.queryBus.ask(query);

        return OpenApiResponse.many(result, HttpStatus.OK);
    }

    @PutMapping("/{subProjectId}")
    public OpenApiResponse<Empty> upsertSubProject(
        @PathVariable UUID projectId,
        @PathVariable UUID subProjectId,
        @RequestBody UpsertSubProjectRequest request
    ) throws Exception {

        UpsertSubProjectCommand command = new UpsertSubProjectCommand(projectId, subProjectId, request);
        this.commandBus.handle(command);

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    @GetMapping("/{subProjectId}")
    public OpenApiResponse<Single<SubProjectResult>> getSubProject(
        @PathVariable UUID projectId,
        @PathVariable UUID subProjectId
    ) throws Exception {

        GetSubProjectQuery query = new GetSubProjectQuery(projectId, subProjectId);
        Item<SubProjectResult> result = this.queryBus.ask(query);

        return OpenApiResponse.one(result, HttpStatus.OK);
    }

    @GetMapping("/{subProjectId}/history")
    public OpenApiResponse<Single<SubProjectResult>> getPreviousSubProjectVersion(
        @PathVariable UUID projectId,
        @PathVariable UUID subProjectId,
        @RequestParam Instant before
    ) throws Exception {

        GetPreviousSubProjectVersionQuery query = new GetPreviousSubProjectVersionQuery(projectId, subProjectId, before);
        Item<SubProjectResult> result = this.queryBus.ask(query);

        return OpenApiResponse.one(result, HttpStatus.OK);
    }

    @PostMapping("/{subProjectId}/deploy")
    public OpenApiResponse<Empty> deploySubProject(
        @PathVariable UUID projectId,
        @PathVariable UUID subProjectId
    ) throws Exception {

        DeploySubProjectCommand command = new DeploySubProjectCommand(projectId, subProjectId);
        this.commandBus.handle(command);

        return OpenApiResponse.empty(HttpStatus.OK);
    }
}
