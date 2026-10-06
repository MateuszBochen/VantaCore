package vantaCore.ui.http.rest.controller.project;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
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
import vantaCore.application.ticket.appliaction.command.deleteTicket.DeleteTicketCommand;
import vantaCore.application.ticket.appliaction.command.upsertTicket.UpsertTicketCommand;
import vantaCore.application.ticket.appliaction.dto.BulkTicketActionRequest;
import vantaCore.application.ticket.appliaction.dto.UpsertTicketRequest;
import vantaCore.application.ticket.appliaction.query.bulkUpdateTickets.BulkTicketActionResult;
import vantaCore.application.ticket.appliaction.query.bulkUpdateTickets.BulkUpdateTicketsQuery;
import vantaCore.application.ticket.appliaction.query.getPreviousTicketVersion.GetPreviousTicketVersionQuery;
import vantaCore.application.ticket.appliaction.query.getPreviousTicketVersion.TicketHistoryResult;
import vantaCore.application.ticket.appliaction.query.getTicket.GetTicketQuery;
import vantaCore.application.ticket.appliaction.query.getTicket.GetTicketResult;
import vantaCore.application.ticket.appliaction.query.listTicketTags.ListTicketTagsQuery;
import vantaCore.application.ticket.appliaction.query.listTickets.ListTicketsQuery;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Empty;
import vantaCore.ui.http.rest.response.dto.Many;
import vantaCore.ui.http.rest.response.dto.Single;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/project/{projectId}/ticket")
final public class TicketController {

    private final CommandBusInterface commandBus;
    private final QueryBusInterface queryBus;

    TicketController(CommandBusInterface commandBus, QueryBusInterface queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }

    @PutMapping("/{ticketId}")
    public OpenApiResponse<Empty> upsertTicket(
        @PathVariable UUID projectId,
        @PathVariable UUID ticketId,
        @RequestBody UpsertTicketRequest request
    ) throws Exception {

        UpsertTicketCommand command = new UpsertTicketCommand(projectId, ticketId, request);
        this.commandBus.handle(command);

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    @DeleteMapping("/{ticketId}")
    public OpenApiResponse<Empty> deleteTicket(
        @PathVariable UUID projectId,
        @PathVariable UUID ticketId
    ) throws Exception {

        this.commandBus.handle(new DeleteTicketCommand(projectId, ticketId));

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    // Static "/bulk" segment - see the "/tags" comment below for why this doesn't collide with the
    // "/{ticketId}" variable pattern.
    @PostMapping("/bulk")
    public OpenApiResponse<Single<BulkTicketActionResult>> bulkUpdateTickets(
        @PathVariable UUID projectId,
        @RequestBody BulkTicketActionRequest request
    ) throws Exception {

        Item<BulkTicketActionResult> result = this.queryBus.ask(new BulkUpdateTicketsQuery(projectId, request));

        return OpenApiResponse.one(result, HttpStatus.OK);
    }

    @GetMapping
    public OpenApiResponse<Many<GetTicketResult>> listTickets(
        @PathVariable UUID projectId,
        @RequestParam(required = false) UUID parentId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "25") int limit
    ) throws Exception {

        ListTicketsQuery query = new ListTicketsQuery(projectId, parentId, page, limit);
        Collection<GetTicketResult> result = this.queryBus.ask(query);

        return OpenApiResponse.many(result, HttpStatus.OK);
    }

    // Static "/tags" segment, matched ahead of the "/{ticketId}" variable pattern below by Spring's
    // path matching - not a real ticket id.
    @GetMapping("/tags")
    public OpenApiResponse<Single<List<String>>> listTicketTags(
        @PathVariable UUID projectId
    ) throws Exception {

        Item<List<String>> result = this.queryBus.ask(new ListTicketTagsQuery(projectId));

        return OpenApiResponse.one(result, HttpStatus.OK);
    }

    @GetMapping("/{ticketId}")
    public OpenApiResponse<Single<GetTicketResult>> getTicket(
        @PathVariable UUID projectId,
        @PathVariable String ticketId
    ) throws Exception {

        GetTicketQuery query = new GetTicketQuery(projectId, ticketId);
        Item<GetTicketResult> result = this.queryBus.ask(query);

        return OpenApiResponse.one(result, HttpStatus.OK);
    }

    @GetMapping("/{ticketId}/history")
    public OpenApiResponse<Single<TicketHistoryResult>> getPreviousTicketVersion(
        @PathVariable UUID projectId,
        @PathVariable UUID ticketId,
        @RequestParam Instant before
    ) throws Exception {

        GetPreviousTicketVersionQuery query = new GetPreviousTicketVersionQuery(projectId, ticketId, before);
        Item<TicketHistoryResult> result = this.queryBus.ask(query);

        return OpenApiResponse.one(result, HttpStatus.OK);
    }
}
