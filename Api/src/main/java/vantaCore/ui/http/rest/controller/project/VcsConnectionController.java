package vantaCore.ui.http.rest.controller.project;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.application.vcs.appliaction.command.deleteVcsConnection.DeleteVcsConnectionCommand;
import vantaCore.application.vcs.appliaction.dto.CreateVcsConnectionRequest;
import vantaCore.application.vcs.appliaction.query.createVcsConnection.CreateVcsConnectionQuery;
import vantaCore.application.vcs.appliaction.query.createVcsConnection.VcsConnectionResult;
import vantaCore.application.vcs.appliaction.query.listVcsConnections.ListVcsConnectionsQuery;
import vantaCore.application.vcs.appliaction.query.listVcsConnections.VcsConnectionSummaryResult;
import vantaCore.application.vcs.appliaction.query.regenerateVcsConnectionSecret.RegenerateVcsConnectionSecretQuery;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Empty;
import vantaCore.ui.http.rest.response.dto.Many;
import vantaCore.ui.http.rest.response.dto.Single;

import java.util.UUID;

@RestController
@RequestMapping("/api/project/{projectId}/vcs-connection")
final public class VcsConnectionController {

    private final CommandBusInterface commandBus;
    private final QueryBusInterface queryBus;

    VcsConnectionController(CommandBusInterface commandBus, QueryBusInterface queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }

    @GetMapping
    public OpenApiResponse<Many<VcsConnectionSummaryResult>> listConnections(@PathVariable UUID projectId) throws Exception {
        Collection<VcsConnectionSummaryResult> result = this.queryBus.ask(new ListVcsConnectionsQuery(projectId));

        return OpenApiResponse.many(result, HttpStatus.OK);
    }

    @PostMapping
    public OpenApiResponse<Single<VcsConnectionResult>> createConnection(
        @PathVariable UUID projectId,
        @RequestBody CreateVcsConnectionRequest request
    ) throws Exception {

        Item<VcsConnectionResult> result = this.queryBus.ask(new CreateVcsConnectionQuery(projectId, request));

        return OpenApiResponse.one(result, HttpStatus.CREATED);
    }

    @DeleteMapping("/{connectionId}")
    public OpenApiResponse<Empty> deleteConnection(@PathVariable UUID projectId, @PathVariable UUID connectionId) throws Exception {
        this.commandBus.handle(new DeleteVcsConnectionCommand(projectId, connectionId));

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    @PostMapping("/{connectionId}/secret")
    public OpenApiResponse<Single<VcsConnectionResult>> regenerateSecret(
        @PathVariable UUID projectId,
        @PathVariable UUID connectionId
    ) throws Exception {

        Item<VcsConnectionResult> result = this.queryBus.ask(new RegenerateVcsConnectionSecretQuery(projectId, connectionId));

        return OpenApiResponse.one(result, HttpStatus.OK);
    }
}
