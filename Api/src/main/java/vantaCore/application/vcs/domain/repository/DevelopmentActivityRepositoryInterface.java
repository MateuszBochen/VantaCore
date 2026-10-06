package vantaCore.application.vcs.domain.repository;

import vantaCore.application.vcs.domain.DevelopmentActivityAggregate;

import java.util.Optional;
import java.util.UUID;
import java.util.function.UnaryOperator;

public interface DevelopmentActivityRepositoryInterface {

    /** Plain read for GET .../development - empty when the ticket has no linked activity yet
     (not an error, the frontend just renders no groups). */
    Optional<DevelopmentActivityAggregate> findByTicketId(UUID ticketId);

    /** Atomically loads (or creates empty) this ticket's activity under a row lock, applies the
     mutation, and saves the result within one transaction - concurrent webhook deliveries for the
     same ticket (a push and a pull_request event often arrive within milliseconds of each other)
     serialize on this instead of racing on an unguarded read-modify-write. */
    void update(UUID ticketId, UnaryOperator<DevelopmentActivityAggregate> mutation);
}
