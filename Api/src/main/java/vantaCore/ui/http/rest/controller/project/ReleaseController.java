package vantaCore.ui.http.rest.controller.project;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.release.appliaction.command.upsertRelease.UpsertReleaseCommand;
import vantaCore.application.release.appliaction.dto.UpsertReleaseRequest;
import vantaCore.application.release.appliaction.query.listReleases.ListReleasesQuery;
import vantaCore.application.release.appliaction.query.listReleases.ReleaseResult;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Empty;
import vantaCore.ui.http.rest.response.dto.Many;

import java.util.UUID;

@RestController
@RequestMapping("/api/project/{projectId}/release")
final public class ReleaseController {

    private final CommandBusInterface commandBus;
    private final QueryBusInterface queryBus;

    ReleaseController(CommandBusInterface commandBus, QueryBusInterface queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }

    @PutMapping("/{releaseId}")
    public OpenApiResponse<Empty> upsertRelease(
        @PathVariable UUID projectId,
        @PathVariable UUID releaseId,
        @RequestBody UpsertReleaseRequest request
    ) throws Exception {

        this.commandBus.handle(new UpsertReleaseCommand(projectId, releaseId, request));

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    @GetMapping
    public OpenApiResponse<Many<ReleaseResult>> listReleases(
        @PathVariable UUID projectId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "25") int limit
    ) throws Exception {

        Collection<ReleaseResult> result = this.queryBus.ask(new ListReleasesQuery(projectId, page, limit));

        return OpenApiResponse.many(result, HttpStatus.OK);
    }
}
