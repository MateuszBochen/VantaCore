package vantaCore.application.worklog.appliaction.command.startWorklog;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.exception.TicketNotFoundException;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;
import vantaCore.application.shared.domain.realtime.RealtimeNotifierInterface;
import vantaCore.application.ticket.domain.TicketSnapshot;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;
import vantaCore.application.user.domain.vo.UserId;

import java.util.HashMap;
import java.util.Map;

// Purely a live signal - no persistence. Lets a frontend timer widget open in another tab/device
// auto-start counting when work on a ticket begins elsewhere; the actual logged time still only
// exists once a real worklog entry is POSTed.
@Component
final public class StartWorklogCommandHandler implements CommandHandlerInterface<StartWorklogCommand> {

    private static final String WORKLOG_STARTED_EVENT = "WORKLOG_STARTED";

    private final ProjectAggregateRepositoryInterface projectRepository;
    private final TicketAggregateRepositoryInterface ticketRepository;
    private final CurrentUserProviderInterface currentUserProvider;
    private final RealtimeNotifierInterface realtimeNotifier;

    public StartWorklogCommandHandler(
        ProjectAggregateRepositoryInterface projectRepository,
        TicketAggregateRepositoryInterface ticketRepository,
        CurrentUserProviderInterface currentUserProvider,
        RealtimeNotifierInterface realtimeNotifier
    ) {
        this.projectRepository = projectRepository;
        this.ticketRepository = ticketRepository;
        this.currentUserProvider = currentUserProvider;
        this.realtimeNotifier = realtimeNotifier;
    }

    @Override
    public Void handle(StartWorklogCommand command) {
        ProjectId projectId = new ProjectId(command.getProjectId());
        TicketId ticketId = new TicketId(command.getTicketId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        TicketSnapshot ticket = this.ticketRepository.findById(ticketId)
            .orElseThrow(TicketNotFoundException::new)
            .toSnapshot();

        UserId currentUserId = this.currentUserProvider.getCurrentUserId();

        Map<String, Object> payload = new HashMap<>();
        payload.put("ticketId", ticket.id().value());
        payload.put("ticketKey", ticket.key().value());
        payload.put("startedAt", command.getStartWorklogRequest().getStartedAt());

        // notifyUser, not broadcastAll - this is meant for the acting user's own other sessions only.
        this.realtimeNotifier.notifyUser(currentUserId.value(), WORKLOG_STARTED_EVENT, payload);

        return null;
    }
}
