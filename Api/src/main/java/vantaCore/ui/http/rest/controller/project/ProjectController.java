package vantaCore.ui.http.rest.controller.project;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.project.appliaction.command.upsertProject.UpsertProjectCommand;
import vantaCore.application.project.appliaction.dto.UpsertProjectRequest;
import vantaCore.application.project.appliaction.query.getProject.GetProjectQuery;
import vantaCore.application.project.appliaction.query.getProject.ProjectResult;
import vantaCore.application.project.appliaction.query.listProjects.ListProjectsQuery;
import vantaCore.application.project.appliaction.query.listProjects.ProjectSummaryResult;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Empty;
import vantaCore.ui.http.rest.response.dto.Many;
import vantaCore.ui.http.rest.response.dto.Single;

import java.util.UUID;

@RestController
@RequestMapping("/api/project")
final public class ProjectController {

    private final CommandBusInterface commandBus;
    private final QueryBusInterface queryBus;

    ProjectController(CommandBusInterface commandBus, QueryBusInterface queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }

    @PutMapping("/{id}")
    public OpenApiResponse<Empty> upsertProject(
        @PathVariable UUID id,
        @RequestBody UpsertProjectRequest request
    ) throws Exception {

        UpsertProjectCommand command = new UpsertProjectCommand(id, request);
        this.commandBus.handle(command);

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public OpenApiResponse<Single<ProjectResult>> getProject(
        @PathVariable UUID id
    ) throws Exception {

        GetProjectQuery query = new GetProjectQuery(id);
        Item<ProjectResult> result = this.queryBus.ask(query);

        return OpenApiResponse.one(result, HttpStatus.OK);
    }

    @GetMapping
    public OpenApiResponse<Many<ProjectSummaryResult>> listProjects() throws Exception {

        ListProjectsQuery query = new ListProjectsQuery();
        Collection<ProjectSummaryResult> result = this.queryBus.ask(query);

        return OpenApiResponse.many(result, HttpStatus.OK);
    }
}
