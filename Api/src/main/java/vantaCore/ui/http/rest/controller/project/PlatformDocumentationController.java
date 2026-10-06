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
import vantaCore.application.documentation.platform.appliaction.command.upsertPlatformDocumentation.UpsertPlatformDocumentationCommand;
import vantaCore.application.documentation.platform.appliaction.dto.UpsertPlatformDocumentationRequest;
import vantaCore.application.documentation.platform.appliaction.query.getPlatformDocumentation.GetPlatformDocumentationQuery;
import vantaCore.application.documentation.platform.appliaction.query.getPreviousPlatformDocumentationVersion.GetPreviousPlatformDocumentationVersionQuery;
import vantaCore.application.documentation.platform.appliaction.query.result.PlatformDocumentationResult;
import vantaCore.application.documentation.search.appliaction.command.reindexProjectDocumentation.ReindexProjectDocumentationCommand;
import vantaCore.application.documentation.search.appliaction.dto.AskDocumentationRequest;
import vantaCore.application.documentation.search.appliaction.query.askDocumentation.AskDocumentationQuery;
import vantaCore.application.documentation.search.appliaction.query.askDocumentation.AskDocumentationResult;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Empty;
import vantaCore.ui.http.rest.response.dto.Single;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/project/{projectId}/documentation")
final public class PlatformDocumentationController {

    private final CommandBusInterface commandBus;
    private final QueryBusInterface queryBus;

    PlatformDocumentationController(CommandBusInterface commandBus, QueryBusInterface queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }

    @PutMapping
    public OpenApiResponse<Empty> upsertPlatformDocumentation(
        @PathVariable UUID projectId,
        @RequestBody UpsertPlatformDocumentationRequest request
    ) throws Exception {

        UpsertPlatformDocumentationCommand command = new UpsertPlatformDocumentationCommand(projectId, request);
        this.commandBus.handle(command);

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    @GetMapping
    public OpenApiResponse<Single<PlatformDocumentationResult>> getPlatformDocumentation(
        @PathVariable UUID projectId
    ) throws Exception {

        GetPlatformDocumentationQuery query = new GetPlatformDocumentationQuery(projectId);
        Item<PlatformDocumentationResult> result = this.queryBus.ask(query);

        return OpenApiResponse.one(result, HttpStatus.OK);
    }

    @GetMapping("/history")
    public OpenApiResponse<Single<PlatformDocumentationResult>> getPreviousPlatformDocumentationVersion(
        @PathVariable UUID projectId,
        @RequestParam Instant before
    ) throws Exception {

        GetPreviousPlatformDocumentationVersionQuery query = new GetPreviousPlatformDocumentationVersionQuery(projectId, before);
        Item<PlatformDocumentationResult> result = this.queryBus.ask(query);

        return OpenApiResponse.one(result, HttpStatus.OK);
    }

    @PostMapping("/ask")
    public OpenApiResponse<Single<AskDocumentationResult>> askDocumentation(
        @PathVariable UUID projectId,
        @RequestBody AskDocumentationRequest request
    ) throws Exception {

        AskDocumentationQuery query = new AskDocumentationQuery(projectId, request);
        Item<AskDocumentationResult> result = this.queryBus.ask(query);

        return OpenApiResponse.one(result, HttpStatus.OK);
    }

    // Manual/backfill trigger - see ReindexProjectDocumentationCommandHandler. Needed for content
    // saved before the reindex-on-save wiring existed (or to recover a stale index) without
    // requiring a no-op re-save of every Platform/Project Doc.
    @PostMapping("/reindex")
    public OpenApiResponse<Empty> reindexProjectDocumentation(
        @PathVariable UUID projectId
    ) throws Exception {

        this.commandBus.handle(new ReindexProjectDocumentationCommand(projectId));

        return OpenApiResponse.empty(HttpStatus.OK);
    }
}
