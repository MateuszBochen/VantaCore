package vantaCore.application.testCase.appliaction.command.upsertTestCases;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.exception.TicketNotFoundException;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;
import vantaCore.application.testCase.appliaction.dto.TestCaseItemRequest;
import vantaCore.application.testCase.appliaction.dto.UpsertTestCasesRequest;
import vantaCore.application.testCase.domain.TestCaseAggregate;
import vantaCore.application.testCase.domain.repository.TestCaseAggregateRepositoryInterface;
import vantaCore.application.testCase.domain.vo.TestCaseId;
import vantaCore.application.testCase.domain.vo.TestCaseStatus;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;
import vantaCore.application.user.domain.vo.UserId;

import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Full replace, diffed by the client-supplied id in each item, same semantics as Project's
 issueTypes/automationRules: an item missing from the payload is deleted, a known id is updated in
 place (keeping its original author/createdAt), an unknown id is created (author/createdAt = now). */
@Component
final public class UpsertTestCasesCommandHandler implements CommandHandlerInterface<UpsertTestCasesCommand> {

    private final ProjectAggregateRepositoryInterface projectRepository;
    private final TicketAggregateRepositoryInterface ticketRepository;
    private final TestCaseAggregateRepositoryInterface repository;
    private final CurrentUserProviderInterface currentUserProvider;

    public UpsertTestCasesCommandHandler(
        ProjectAggregateRepositoryInterface projectRepository,
        TicketAggregateRepositoryInterface ticketRepository,
        TestCaseAggregateRepositoryInterface repository,
        CurrentUserProviderInterface currentUserProvider
    ) {
        this.projectRepository = projectRepository;
        this.ticketRepository = ticketRepository;
        this.repository = repository;
        this.currentUserProvider = currentUserProvider;
    }

    @Override
    public Void handle(UpsertTestCasesCommand command) {
        ProjectId projectId = new ProjectId(command.getProjectId());
        TicketId ticketId = new TicketId(command.getTicketId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);
        this.ticketRepository.findById(ticketId).orElseThrow(TicketNotFoundException::new);

        UpsertTestCasesRequest request = command.getUpsertTestCasesRequest();
        List<TestCaseItemRequest> items = request.getTestCases() == null ? List.of() : request.getTestCases();

        Map<UUID, TestCaseAggregate> existingById = new HashMap<>();
        for (TestCaseAggregate testCase : this.repository.findAllByTicketId(ticketId.value())) {
            existingById.put(testCase.toSnapshot().id().value(), testCase);
        }

        Set<UUID> incomingIds = new HashSet<>();
        for (TestCaseItemRequest item : items) {
            incomingIds.add(item.getId());
        }

        for (UUID existingId : existingById.keySet()) {
            if (!incomingIds.contains(existingId)) {
                this.repository.deleteById(new TestCaseId(existingId));
            }
        }

        UserId currentUserId = this.currentUserProvider.getCurrentUserId();
        Instant now = Instant.now();

        for (TestCaseItemRequest item : items) {
            TestCaseStatus status = TestCaseStatus.fromWireValue(item.getStatus());
            TestCaseAggregate existing = existingById.get(item.getId());

            TestCaseAggregate testCase = existing != null
                ? existing.changeTestCase(item.getTitle(), item.getSteps(), item.getExpectedResult(), status)
                : TestCaseAggregate.newTestCase(
                    new TestCaseId(item.getId()),
                    ticketId.value(),
                    currentUserId.value(),
                    item.getTitle(),
                    item.getSteps(),
                    item.getExpectedResult(),
                    status,
                    now
                );

            this.repository.save(testCase);
        }

        return null;
    }
}
