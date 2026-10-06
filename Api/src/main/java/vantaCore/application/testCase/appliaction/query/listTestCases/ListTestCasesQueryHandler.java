package vantaCore.application.testCase.appliaction.query.listTestCases;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.exception.TicketNotFoundException;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.testCase.domain.TestCaseAggregate;
import vantaCore.application.testCase.domain.TestCaseSnapshot;
import vantaCore.application.testCase.domain.repository.TestCaseAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;

import java.util.List;

@Component
final public class ListTestCasesQueryHandler implements QueryHandlerInterface<ListTestCasesQuery, Collection<TestCaseResult>> {

    private final TestCaseAggregateRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final TicketAggregateRepositoryInterface ticketRepository;

    public ListTestCasesQueryHandler(
        TestCaseAggregateRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository,
        TicketAggregateRepositoryInterface ticketRepository
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.ticketRepository = ticketRepository;
    }

    @Override
    public Collection<TestCaseResult> handle(ListTestCasesQuery query) {
        ProjectId projectId = new ProjectId(query.getProjectId());
        TicketId ticketId = new TicketId(query.getTicketId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);
        this.ticketRepository.findById(ticketId).orElseThrow(TicketNotFoundException::new);

        List<Item<TestCaseResult>> items = this.repository.findAllByTicketId(ticketId.value()).stream()
            .map(TestCaseAggregate::toSnapshot)
            .map(this::toItem)
            .toList();

        return new Collection<>(0, items.size(), items.size(), items);
    }

    private Item<TestCaseResult> toItem(TestCaseSnapshot snapshot) {
        return Item.fromPayload(snapshot.id().toString(), new TestCaseResult(
            snapshot.id().value(),
            snapshot.title(),
            snapshot.steps(),
            snapshot.expectedResult(),
            snapshot.status() != null ? snapshot.status().toWireValue() : null,
            snapshot.createdAt(),
            new TestCaseAuthorResult(snapshot.authorId())
        ));
    }
}
