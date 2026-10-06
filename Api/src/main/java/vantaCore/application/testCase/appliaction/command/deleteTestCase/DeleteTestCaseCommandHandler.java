package vantaCore.application.testCase.appliaction.command.deleteTestCase;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.exception.TestCaseNotFoundException;
import vantaCore.application.shared.application.exception.TicketNotFoundException;
import vantaCore.application.testCase.domain.TestCaseAggregate;
import vantaCore.application.testCase.domain.repository.TestCaseAggregateRepositoryInterface;
import vantaCore.application.testCase.domain.vo.TestCaseId;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;

@Component
final public class DeleteTestCaseCommandHandler implements CommandHandlerInterface<DeleteTestCaseCommand> {

    private final ProjectAggregateRepositoryInterface projectRepository;
    private final TicketAggregateRepositoryInterface ticketRepository;
    private final TestCaseAggregateRepositoryInterface repository;

    public DeleteTestCaseCommandHandler(
        ProjectAggregateRepositoryInterface projectRepository,
        TicketAggregateRepositoryInterface ticketRepository,
        TestCaseAggregateRepositoryInterface repository
    ) {
        this.projectRepository = projectRepository;
        this.ticketRepository = ticketRepository;
        this.repository = repository;
    }

    @Override
    public Void handle(DeleteTestCaseCommand command) {
        ProjectId projectId = new ProjectId(command.getProjectId());
        TicketId ticketId = new TicketId(command.getTicketId());
        TestCaseId testCaseId = new TestCaseId(command.getTestCaseId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);
        this.ticketRepository.findById(ticketId).orElseThrow(TicketNotFoundException::new);

        TestCaseAggregate existing = this.repository.findById(testCaseId)
            .orElseThrow(TestCaseNotFoundException::new);

        if (!existing.toSnapshot().ticketId().equals(ticketId.value())) {
            throw new TestCaseNotFoundException();
        }

        this.repository.deleteById(testCaseId);

        return null;
    }
}
