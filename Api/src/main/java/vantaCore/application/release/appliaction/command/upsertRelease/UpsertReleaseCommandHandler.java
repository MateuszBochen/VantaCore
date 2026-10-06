package vantaCore.application.release.appliaction.command.upsertRelease;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.release.appliaction.dto.UpsertReleaseRequest;
import vantaCore.application.release.domain.ReleaseAggregate;
import vantaCore.application.release.domain.policy.UpsertReleaseCheck;
import vantaCore.application.release.domain.policy.UpsertReleasePolicy;
import vantaCore.application.release.domain.repository.ReleaseAggregateRepositoryInterface;
import vantaCore.application.release.domain.vo.ReleaseId;
import vantaCore.application.release.domain.vo.ReleaseStatus;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.exception.TicketNotFoundException;
import vantaCore.application.shared.application.exception.UnprocessableEntityException;
import vantaCore.application.ticket.domain.TicketAggregate;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
final public class UpsertReleaseCommandHandler implements CommandHandlerInterface<UpsertReleaseCommand> {

    private final ReleaseAggregateRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final TicketAggregateRepositoryInterface ticketRepository;
    private final UpsertReleasePolicy upsertReleasePolicy;

    public UpsertReleaseCommandHandler(
        ReleaseAggregateRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository,
        TicketAggregateRepositoryInterface ticketRepository,
        UpsertReleasePolicy upsertReleasePolicy
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.ticketRepository = ticketRepository;
        this.upsertReleasePolicy = upsertReleasePolicy;
    }

    @Override
    public Void handle(UpsertReleaseCommand command) {
        UUID projectId = command.getProjectId();
        ReleaseId releaseId = new ReleaseId(command.getReleaseId());

        this.projectRepository.findById(new ProjectId(projectId)).orElseThrow(ProjectNotFoundException::new);

        UpsertReleaseRequest request = command.getUpsertReleaseRequest();
        ReleaseStatus status = toReleaseStatus(request.getStatus());
        String afterCarePeriod = normalizeAfterCarePeriod(request.getAfterCarePeriod());

        Set<UUID> ticketIds = request.getTicketIds() == null ? Set.of() : Set.copyOf(request.getTicketIds());

        Map<UUID, TicketAggregate> fetchedTickets = this.ticketRepository.findAllByIds(ticketIds).stream()
            .collect(Collectors.toMap(t -> t.toSnapshot().id().value(), Function.identity()));

        for (UUID ticketId : ticketIds) {
            TicketAggregate ticket = fetchedTickets.get(ticketId);
            if (ticket == null || !ticket.toSnapshot().projectId().equals(projectId)) {
                throw new TicketNotFoundException();
            }
        }

        this.upsertReleasePolicy.check(new UpsertReleaseCheck(projectId, request.getVersionNumber(), releaseId)).assertAllowed();

        ReleaseAggregate release = this.repository.findById(releaseId)
            .map(current -> current.changeRelease(
                request.getPlannedReleaseDate(),
                afterCarePeriod,
                status,
                request.getVersionNumber(),
                request.getName(),
                ticketIds
            ))
            .orElseGet(() -> ReleaseAggregate.newRelease(
                releaseId,
                projectId,
                request.getPlannedReleaseDate(),
                afterCarePeriod,
                status,
                request.getVersionNumber(),
                request.getName(),
                ticketIds
            ));

        this.repository.save(release);

        return null;
    }

    /** '' / blank from the client means "no after-care planned" - stored as NULL. Any other value
     is kept verbatim (the frontend picks from a fixed ISO-8601 duration list; an unknown value is
     still stored rather than rejected, matching how the frontend renders unrecognised ones). */
    private String normalizeAfterCarePeriod(String afterCarePeriod) {
        if (afterCarePeriod == null || afterCarePeriod.isBlank()) {
            return null;
        }

        return afterCarePeriod.trim();
    }

    private ReleaseStatus toReleaseStatus(String status) {
        try {
            return ReleaseStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new UnprocessableEntityException(List.of(
                new Notification("release.status.invalid", "Unknown release status: " + status, true)
            ));
        }
    }
}
