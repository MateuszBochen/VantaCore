package vantaCore.application.ticket.appliaction.service;

import org.springframework.stereotype.Component;
import vantaCore.application.ticket.appliaction.query.getTicket.TicketRelatedTicketResult;
import vantaCore.application.ticket.domain.TicketAggregate;
import vantaCore.application.ticket.domain.TicketSnapshot;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketRelation;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Turns a ticket's raw {relatedTicketId, type} relations into the enriched {ticketId, type, key,
 title, projectId} shape both GetTicketResult (TicketResultAssembler) and the WebSocket ticket
 broadcasts (TicketBroadcastResult) use - one lookup implementation for both read paths. */
@Component
public class TicketRelationEnricher {

    private final TicketAggregateRepositoryInterface repository;

    public TicketRelationEnricher(TicketAggregateRepositoryInterface repository) {
        this.repository = repository;
    }

    // Best-effort - a related ticket that's vanished (tickets aren't deletable in this app today,
    // so effectively never happens) is skipped rather than failing the whole read.
    public List<TicketRelatedTicketResult> enrich(Set<TicketRelation> relations) {
        if (relations.isEmpty()) {
            return List.of();
        }

        Set<UUID> relatedIds = relations.stream().map(TicketRelation::relatedTicketId).collect(Collectors.toSet());
        Map<UUID, TicketSnapshot> relatedById = this.repository.findAllByIds(relatedIds).stream()
            .map(TicketAggregate::toSnapshot)
            .collect(Collectors.toMap(snapshot -> snapshot.id().value(), Function.identity()));

        return relations.stream()
            .map(relation -> {
                TicketSnapshot related = relatedById.get(relation.relatedTicketId());
                if (related == null) {
                    return null;
                }

                return new TicketRelatedTicketResult(
                    related.id().value(),
                    relation.type(),
                    related.key().value(),
                    related.title(),
                    related.projectId()
                );
            })
            .filter(result -> result != null)
            .toList();
    }
}
