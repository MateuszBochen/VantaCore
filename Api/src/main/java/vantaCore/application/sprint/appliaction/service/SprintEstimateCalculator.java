package vantaCore.application.sprint.appliaction.service;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.sprint.domain.vo.EstimateUnitValue;
import vantaCore.application.ticket.domain.TicketAggregate;
import vantaCore.application.ticket.domain.TicketSnapshot;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Sums a set of tickets' estimates, grouped by their project's estimate unit - a sprint's board
 can span multiple projects, each with its own single unit (SP, mandays, ...), so results are a
 per-unit breakdown rather than one unit-agnostic total. Backs SprintAggregate's
 initial/closing/actualEstimateUnit snapshots. */
@Component
public class SprintEstimateCalculator {

    private final TicketAggregateRepositoryInterface ticketRepository;
    private final ProjectAggregateRepositoryInterface projectRepository;

    public SprintEstimateCalculator(
        TicketAggregateRepositoryInterface ticketRepository,
        ProjectAggregateRepositoryInterface projectRepository
    ) {
        this.ticketRepository = ticketRepository;
        this.projectRepository = projectRepository;
    }

    /** onlyDoneTickets=false sums every ticket (initial/closing scope); true restricts to tickets
     whose current status is done (actual). Tickets or projects that have since vanished, and
     projects with no configured estimate unit, are silently skipped - same "best-effort snapshot,
     not a live join" precedent as CloseSprintCommandHandler's report building. */
    public List<EstimateUnitValue> calculate(Set<UUID> ticketIds, boolean onlyDoneTickets) {
        Map<UUID, ProjectAggregate> projectCache = new HashMap<>();
        Map<String, Double> totalsByUnit = new HashMap<>();

        for (UUID ticketId : ticketIds) {
            TicketSnapshot ticket = this.ticketRepository.findById(new TicketId(ticketId))
                .map(TicketAggregate::toSnapshot)
                .orElse(null);

            if (ticket == null) {
                continue;
            }

            ProjectAggregate project = projectCache.computeIfAbsent(
                ticket.projectId(),
                id -> this.projectRepository.findById(new ProjectId(id)).orElse(null)
            );

            if (project == null || project.getEstimateUnit() == null || project.getEstimateUnit().isBlank()) {
                continue;
            }

            if (onlyDoneTickets && !project.isStatusDone(ticket.statusId())) {
                continue;
            }

            totalsByUnit.merge(project.getEstimateUnit(), ticket.estimate(), Double::sum);
        }

        return totalsByUnit.entrySet().stream()
            .map(entry -> new EstimateUnitValue(entry.getKey(), entry.getValue()))
            .toList();
    }
}
