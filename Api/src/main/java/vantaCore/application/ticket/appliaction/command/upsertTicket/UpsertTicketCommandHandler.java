package vantaCore.application.ticket.appliaction.command.upsertTicket;

import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import vantaCore.application.board.domain.BoardAggregate;
import vantaCore.application.board.domain.repository.BoardAggregateRepositoryInterface;
import vantaCore.application.board.domain.vo.BoardId;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.event.EventBusInterface;
import vantaCore.application.shared.application.exception.BoardNotFoundException;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.exception.TicketNotFoundException;
import vantaCore.application.shared.application.mention.MentionParser;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;
import vantaCore.application.sprint.domain.SprintAggregate;
import vantaCore.application.sprint.domain.repository.SprintAggregateRepositoryInterface;
import vantaCore.application.ticket.appliaction.command.propagateAutomation.PropagateAutomationCommand;
import vantaCore.application.ticket.appliaction.command.propagateEstimate.PropagateEstimateCommand;
import vantaCore.application.ticket.appliaction.command.propagateProgress.PropagateProgressCommand;
import vantaCore.application.ticket.appliaction.dto.RelatedTicketRequest;
import vantaCore.application.ticket.appliaction.dto.UpsertTicketRequest;
import vantaCore.application.ticket.appliaction.service.CustomFieldSearchTextMapper;
import vantaCore.application.ticket.domain.TicketAggregate;
import vantaCore.application.ticket.domain.TicketSnapshot;
import vantaCore.application.ticket.domain.event.NewTicketWasCreated;
import vantaCore.application.ticket.domain.event.TicketFieldWasChanged;
import vantaCore.application.ticket.domain.event.TicketStatusWasChanged;
import vantaCore.application.ticket.domain.event.TicketWasChanged;
import vantaCore.application.ticket.domain.event.UsersWereMentionedInTicket;
import vantaCore.application.ticket.domain.history.TicketHistoryEntryAggregate;
import vantaCore.application.ticket.domain.history.TicketHistoryEntryAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.history.TicketHistorySnapshot;
import vantaCore.application.ticket.domain.policy.TicketAgainstActiveSprintCheck;
import vantaCore.application.ticket.domain.policy.TicketAgainstActiveSprintPolicy;
import vantaCore.application.ticket.domain.policy.TicketAgainstProjectCheck;
import vantaCore.application.ticket.domain.policy.UpsertTicketPolicy;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;
import vantaCore.application.ticket.domain.vo.TicketKey;
import vantaCore.application.ticket.domain.vo.TicketRelation;
import vantaCore.application.ticket.domain.vo.TicketRelationType;
import vantaCore.application.user.domain.UserAggregate;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface;
import vantaCore.application.user.domain.vo.UserId;

import java.time.Instant;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
final public class UpsertTicketCommandHandler implements CommandHandlerInterface<UpsertTicketCommand> {

    private final TicketAggregateRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final UserAggregateRepositoryInterface userRepository;
    private final TicketHistoryEntryAggregateRepositoryInterface historyRepository;
    private final SprintAggregateRepositoryInterface sprintRepository;
    private final BoardAggregateRepositoryInterface boardRepository;
    private final UpsertTicketPolicy upsertTicketPolicy;
    private final TicketAgainstActiveSprintPolicy ticketAgainstActiveSprintPolicy;
    private final CurrentUserProviderInterface currentUserProvider;
    private final EventBusInterface eventBus;
    private final CommandBusInterface commandBus;
    private final CustomFieldSearchTextMapper customFieldSearchTextMapper;
    private final MentionParser mentionParser;

    public UpsertTicketCommandHandler(
        TicketAggregateRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository,
        UserAggregateRepositoryInterface userRepository,
        TicketHistoryEntryAggregateRepositoryInterface historyRepository,
        SprintAggregateRepositoryInterface sprintRepository,
        BoardAggregateRepositoryInterface boardRepository,
        UpsertTicketPolicy upsertTicketPolicy,
        TicketAgainstActiveSprintPolicy ticketAgainstActiveSprintPolicy,
        CurrentUserProviderInterface currentUserProvider,
        EventBusInterface eventBus,
        // @Lazy: this handler is itself one of the beans CommandBus's constructor collects, so
        // eagerly resolving CommandBus here would close a construction-time cycle - same reasoning as
        // CreateNotificationWhenNewTicketWasCreated/PropagateTimeSpentWhenTicketTimeWasLogged.
        @Lazy CommandBusInterface commandBus,
        CustomFieldSearchTextMapper customFieldSearchTextMapper,
        MentionParser mentionParser
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.historyRepository = historyRepository;
        this.sprintRepository = sprintRepository;
        this.boardRepository = boardRepository;
        this.upsertTicketPolicy = upsertTicketPolicy;
        this.ticketAgainstActiveSprintPolicy = ticketAgainstActiveSprintPolicy;
        this.currentUserProvider = currentUserProvider;
        this.eventBus = eventBus;
        this.commandBus = commandBus;
        this.customFieldSearchTextMapper = customFieldSearchTextMapper;
        this.mentionParser = mentionParser;
    }

    @Override
    public Void handle(UpsertTicketCommand command) {
        TicketId ticketId = new TicketId(command.getTicketId());
        ProjectId projectId = new ProjectId(command.getProjectId());

        ProjectAggregate project = this.projectRepository.findById(projectId)
            .orElseThrow(ProjectNotFoundException::new);

        Optional<TicketAggregate> existing = this.repository.findById(ticketId);
        boolean isNew = existing.isEmpty();

        UpsertTicketRequest request = command.getUpsertTicketRequest();
        Instant now = Instant.now();
        boolean requestedStatusIsDone = project.isStatusDone(request.getStatusId());

        Set<TicketRelation> oldRelations = existing.map(current -> current.toSnapshot().relatedTickets()).orElse(Set.of());
        Set<TicketRelation> newRelations = toRelationSet(ticketId.value(), request.getRelatedTickets());
        assertRelatedTicketsExist(newRelations);

        TicketAggregate ticket = existing
            .map(current -> current.changeTicket(
                request.getSubProjectId(),
                request.getIssueTypeId(),
                request.getStatusId(),
                request.getParentId(),
                request.getTitle(),
                request.getDescription(),
                request.getPriority(),
                toEstimate(request.getEstimate()),
                toUuidSet(request.getAssigneeIds()),
                toUuidSet(request.getFlagIds()),
                toStringSet(request.getTags()),
                request.getCustomFields(),
                newRelations,
                requestedStatusIsDone,
                now
            ))
            .orElseGet(() -> TicketAggregate.newTicket(
                ticketId,
                generateKey(project, projectId),
                this.currentUserProvider.getCurrentUserId().value(),
                projectId.value(),
                request.getSubProjectId(),
                request.getIssueTypeId(),
                request.getStatusId(),
                request.getParentId(),
                request.getTitle(),
                request.getDescription(),
                request.getPriority(),
                toEstimate(request.getEstimate()),
                toUuidSet(request.getAssigneeIds()),
                toUuidSet(request.getFlagIds()),
                toStringSet(request.getTags()),
                request.getCustomFields(),
                newRelations,
                now,
                now,
                null
            ).withStatus(request.getStatusId(), requestedStatusIsDone, now));

        this.upsertTicketPolicy.check(new TicketAgainstProjectCheck(ticket, project)).assertAllowed();

        if (!isNew) {
            checkAgainstActiveSprint(existing.get().toSnapshot(), ticket.toSnapshot());
        }

        double previousEstimate = existing.map(current -> current.toSnapshot().estimate()).orElse(0.0);
        double newEstimate = ticket.toSnapshot().estimate();

        // A brand-new ticket has no "previous" state to speak of, so isDone defaults to false - any
        // done status it's created with already counts as a fresh completion.
        boolean wasDone = existing
            .map(TicketAggregate::toSnapshot)
            .map(previous -> project.isStatusDone(previous.statusId()))
            .orElse(false);
        boolean isDone = project.isStatusDone(ticket.toSnapshot().statusId());

        this.repository.save(ticket);
        recordHistory(ticket.toSnapshot(), now);
        syncInverseRelations(ticketId.value(), oldRelations, newRelations);

        // Best-effort search indexing (see CustomFieldSearchTextMapper) - deliberately after save(),
        // via its own atomic UPDATE, same reasoning as the estimate propagation below.
        String searchText = this.customFieldSearchTextMapper.map(ticket.toSnapshot().customFields(), project.getCustomFieldDefinitions());
        this.repository.updateCustomFieldsSearchText(ticketId, searchText);

        // Estimate rollup propagation is intra-module (ticket -> ticket, up its own parent chain), not
        // a cross-module side effect - so unlike the notification/WS cases below, this goes straight
        // through CommandBus rather than an event, same @Lazy reasoning applies to avoid the cycle.
        dispatch(new PropagateEstimateCommand(ticketId.value(), newEstimate - previousEstimate));

        // "Auto-set status when all children are done" (project.automationRules) + the reverse
        // (marking a parent done cascades to its children) - only worth checking on a genuine
        // false->true transition, not on every unrelated edit of an already-done ticket.
        if (!wasDone && isDone) {
            dispatch(new PropagateAutomationCommand(ticketId.value()));
        }

        // Progress rollup: a parent's percentage only actually changes when either (a) this ticket
        // is brand new (changes its parent's child count/denominator, regardless of its own done
        // state) or (b) its done/not-done classification flipped in either direction (unlike the
        // automation check above, which only cares about false->true) - a save that leaves the
        // ticket's own done-state unchanged can't have moved any ancestor's percentage. Reparenting
        // an existing ticket is deliberately NOT handled here, same accepted gap as estimate_all/
        // time_spent_all not reacting to a parentId change either.
        UUID parentId = ticket.toSnapshot().parentId();
        if (parentId != null && (isNew || wasDone != isDone)) {
            dispatch(new PropagateProgressCommand(parentId));
        }

        // WS broadcast + assignee notifications are side effects of these events, not this handler's
        // concern - see NewTicketWasCreatedWebSocketHandler/TicketWasChangedWebSocketHandler
        // (vantaCore.ui.http.ws) and CreateNotificationWhenNewTicketWasCreated
        // (vantaCore.application.notification.appliaction.eventHandler).
        if (isNew) {
            this.eventBus.dispatch(new NewTicketWasCreated(ticket.toSnapshot()));
        } else {
            this.eventBus.dispatch(new TicketWasChanged(ticket.toSnapshot()));
        }

        notifyNewlyMentionedUsers(existing, ticket);

        if (!isNew) {
            notifyIfStatusChanged(existing.get().toSnapshot(), ticket.toSnapshot());
            notifyChangedCustomFields(existing.get().toSnapshot(), ticket.toSnapshot());
        }

        return null;
    }

    // Not fired for a brand-new ticket - its initial status didn't "change" from anything, and
    // NewTicketWasCreated already covers that moment. Automation Engine's TICKET_STATUS_CHANGED
    // trigger is the sole consumer today (see RunAutomationRulesWhenTicketStatusWasChanged).
    private void notifyIfStatusChanged(TicketSnapshot previous, TicketSnapshot updated) {
        if (!Objects.equals(previous.statusId(), updated.statusId())) {
            this.eventBus.dispatch(new TicketStatusWasChanged(updated, previous.statusId()));
        }
    }

    // One event per custom field whose value genuinely changed - see TicketFieldWasChanged's
    // javadoc for why not a single event carrying the whole changed-keys set. Built-in fields
    // (title/status/etc.) aren't covered here; they either have their own dedicated event
    // (status) or no automation trigger needs them changed-detection for yet.
    private void notifyChangedCustomFields(TicketSnapshot previous, TicketSnapshot updated) {
        Set<String> changedFieldIds = new HashSet<>();
        changedFieldIds.addAll(previous.customFields().keySet());
        changedFieldIds.addAll(updated.customFields().keySet());

        for (String fieldId : changedFieldIds) {
            if (!Objects.equals(previous.customFields().get(fieldId), updated.customFields().get(fieldId))) {
                this.eventBus.dispatch(new TicketFieldWasChanged(updated, fieldId));
            }
        }
    }

    // Only @mentions that weren't already in the description on the previous save - re-saving a
    // ticket with an untouched description must not re-notify. existing is the state from BEFORE
    // this save (empty for a brand-new ticket, so every mention in a new ticket's description
    // counts as "new"); ticket is the state AFTER. Self-mentions notify too (deliberately not
    // filtered out) - handy for someone bookmarking their own ticket as a reminder.
    private void notifyNewlyMentionedUsers(Optional<TicketAggregate> existing, TicketAggregate ticket) {
        Set<UUID> oldMentions = existing
            .map(current -> this.mentionParser.parseMentionedUserIds(current.toSnapshot().description()))
            .orElse(Set.of());
        Set<UUID> newMentions = this.mentionParser.parseMentionedUserIds(ticket.toSnapshot().description());

        Set<UUID> addedMentions = new HashSet<>(newMentions);
        addedMentions.removeAll(oldMentions);

        if (addedMentions.isEmpty()) {
            return;
        }

        // Existence-filtering a mentioned id (garbage/deleted-user ids can end up in free text) is
        // the notification module's concern, not this handler's - see
        // CreateMentionNotificationWhenUsersWereMentionedInTicket
        // (vantaCore.application.notification.appliaction.eventHandler).
        UUID currentUserId = this.currentUserProvider.getCurrentUserId().value();
        this.eventBus.dispatch(new UsersWereMentionedInTicket(ticket.toSnapshot(), addedMentions, currentUserId));
    }

    // Appended on every save, creation included - mirrors UpsertSubProjectCommandHandler's "every
    // write is a version" approach, just into a separate append-only table instead of tickets itself
    // (see V14__create_ticket_history.sql for why).
    private void recordHistory(TicketSnapshot ticket, Instant now) {
        UserId currentUserId = this.currentUserProvider.getCurrentUserId();
        UserAggregate currentUser = this.userRepository.findById(currentUserId);

        TicketHistorySnapshot snapshot = new TicketHistorySnapshot(
            ticket.subProjectId(),
            ticket.issueTypeId(),
            ticket.statusId(),
            ticket.parentId(),
            ticket.title(),
            ticket.description(),
            ticket.priority(),
            ticket.estimate(),
            ticket.assigneeIds(),
            ticket.flagIds(),
            ticket.tags(),
            ticket.customFields(),
            ticket.relatedTickets()
        );

        TicketHistoryEntryAggregate entry = TicketHistoryEntryAggregate.newEntry(
            UUID.randomUUID(),
            ticket.id().value(),
            currentUser.getId().value(),
            currentUser.getCredentials().email().value(),
            now,
            snapshot
        );

        this.historyRepository.save(entry);
    }

    // Cross-module read-only lookup (Ticket -> Sprint -> Board), same carve-out as
    // TicketAgainstProjectCheck's project lookup - this needs an answer in the same request, an async
    // event can't gate the save.
    private void checkAgainstActiveSprint(TicketSnapshot previous, TicketSnapshot updated) {
        for (SprintAggregate sprint : this.sprintRepository.findAllActiveByTicketId(updated.id().value())) {
            BoardAggregate board = this.boardRepository.findById(new BoardId(sprint.toSnapshot().boardId()))
                .orElseThrow(BoardNotFoundException::new);

            this.ticketAgainstActiveSprintPolicy.check(
                new TicketAgainstActiveSprintCheck(previous, updated, board.toSnapshot())
            ).assertAllowed();
        }
    }

    private void dispatch(PropagateEstimateCommand command) {
        try {
            this.commandBus.handle(command);
        } catch (RuntimeException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to propagate ticket estimate", exception);
        }
    }

    private void dispatch(PropagateAutomationCommand command) {
        try {
            this.commandBus.handle(command);
        } catch (RuntimeException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to propagate ticket automation", exception);
        }
    }

    private void dispatch(PropagateProgressCommand command) {
        try {
            this.commandBus.handle(command);
        } catch (RuntimeException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to propagate ticket progress", exception);
        }
    }

    // Deduped by target ticketId (last one in the request list wins on a duplicate, same
    // last-wins precedent as UpdateSprintTicketCommandHandler's batch) and a self-reference is
    // silently dropped rather than rejected - a ticket relating to itself is meaningless, not a
    // validation error worth bothering the caller with.
    private Set<TicketRelation> toRelationSet(UUID ownTicketId, List<RelatedTicketRequest> tickets) {
        if (tickets == null) {
            return Set.of();
        }

        Map<UUID, TicketRelationType> byTarget = new LinkedHashMap<>();
        for (RelatedTicketRequest ticket : tickets) {
            if (!ticket.getTicketId().equals(ownTicketId)) {
                byTarget.put(ticket.getTicketId(), ticket.getType());
            }
        }

        return byTarget.entrySet().stream()
            .map(entry -> new TicketRelation(entry.getKey(), entry.getValue()))
            .collect(Collectors.toUnmodifiableSet());
    }

    private void assertRelatedTicketsExist(Set<TicketRelation> relations) {
        Set<UUID> targetIds = relations.stream().map(TicketRelation::relatedTicketId).collect(Collectors.toSet());
        if (targetIds.isEmpty()) {
            return;
        }

        Set<UUID> foundIds = this.repository.findAllByIds(targetIds).stream()
            .map(target -> target.toSnapshot().id().value())
            .collect(Collectors.toSet());

        if (!foundIds.containsAll(targetIds)) {
            throw new TicketNotFoundException();
        }
    }

    // Writes the OTHER side of every relation that was added/retyped/removed by this save, so a
    // relation always reads consistently from both ends (this ticket BLOCKS X <=> X IS_BLOCKED_BY
    // this ticket) without the frontend having to PUT both tickets itself. Targets that no longer
    // exist are skipped, not an error - tickets aren't deletable in this app today, so this is
    // effectively never hit; same best-effort precedent as TicketResultAssembler's enrichment.
    private void syncInverseRelations(UUID ownTicketId, Set<TicketRelation> oldRelations, Set<TicketRelation> newRelations) {
        Map<UUID, TicketRelationType> oldByTarget = oldRelations.stream()
            .collect(Collectors.toMap(TicketRelation::relatedTicketId, TicketRelation::type));
        Map<UUID, TicketRelationType> newByTarget = newRelations.stream()
            .collect(Collectors.toMap(TicketRelation::relatedTicketId, TicketRelation::type));

        Set<UUID> changedTargetIds = new HashSet<>();
        newByTarget.forEach((targetId, type) -> {
            if (!type.equals(oldByTarget.get(targetId))) {
                changedTargetIds.add(targetId);
            }
        });
        oldByTarget.keySet().stream().filter(targetId -> !newByTarget.containsKey(targetId)).forEach(changedTargetIds::add);

        if (changedTargetIds.isEmpty()) {
            return;
        }

        for (TicketAggregate target : this.repository.findAllByIds(changedTargetIds)) {
            TicketSnapshot targetSnapshot = target.toSnapshot();
            UUID targetId = targetSnapshot.id().value();

            Set<TicketRelation> updatedTargetRelations = targetSnapshot.relatedTickets().stream()
                .filter(relation -> !relation.relatedTicketId().equals(ownTicketId))
                .collect(Collectors.toCollection(HashSet::new));

            TicketRelationType newType = newByTarget.get(targetId);
            if (newType != null) {
                updatedTargetRelations.add(new TicketRelation(ownTicketId, newType.inverse()));
            }

            this.repository.save(target.withRelatedTickets(updatedTargetRelations));
        }
    }

    private TicketKey generateKey(ProjectAggregate project, ProjectId projectId) {
        int number = this.projectRepository.incrementAndGetNextTicketNumber(projectId);
        String prefix = project.getPrefix() != null ? project.getPrefix().value() : null;

        return TicketKey.generate(prefix, number);
    }

    private double toEstimate(Double estimate) {
        return estimate == null ? 0.0 : estimate;
    }

    private Set<UUID> toUuidSet(List<UUID> list) {
        return list == null ? Set.of() : Set.copyOf(list);
    }

    private Set<String> toStringSet(List<String> list) {
        return list == null ? Set.of() : Set.copyOf(list);
    }
}
