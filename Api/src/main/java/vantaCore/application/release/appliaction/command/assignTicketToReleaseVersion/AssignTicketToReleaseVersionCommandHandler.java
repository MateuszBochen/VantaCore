package vantaCore.application.release.appliaction.command.assignTicketToReleaseVersion;

import org.springframework.stereotype.Component;
import vantaCore.application.release.domain.ReleaseAggregate;
import vantaCore.application.release.domain.ReleaseSnapshot;
import vantaCore.application.release.domain.repository.ReleaseAggregateRepositoryInterface;
import vantaCore.application.release.domain.vo.ReleaseStatus;
import vantaCore.application.shared.application.command.CommandHandlerInterface;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.Optional;

/** Adds a ticket to the project's "next" release - the PLAN-status release with the earliest
 plannedReleaseDate, resolved fresh at execution time (see the Automation Engine ADR: "next"
 changes as releases actually ship, so this isn't something a rule can cache). A no-op, not an
 error, if the project has no PLAN release at all. */
@Component
final public class AssignTicketToReleaseVersionCommandHandler implements CommandHandlerInterface<AssignTicketToReleaseVersionCommand> {

    private final ReleaseAggregateRepositoryInterface repository;

    public AssignTicketToReleaseVersionCommandHandler(ReleaseAggregateRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public Void handle(AssignTicketToReleaseVersionCommand command) {
        Optional<ReleaseSnapshot> nextRelease = this.repository.findAllByProjectId(command.getProjectId()).stream()
            .map(ReleaseAggregate::toSnapshot)
            .filter(release -> release.status() == ReleaseStatus.PLAN)
            .min(Comparator.comparing(ReleaseSnapshot::plannedReleaseDate, Comparator.nullsLast(LocalDate::compareTo)));

        if (nextRelease.isEmpty()) {
            return null;
        }

        this.repository.addTicket(nextRelease.get().id(), command.getTicketId());

        return null;
    }
}
