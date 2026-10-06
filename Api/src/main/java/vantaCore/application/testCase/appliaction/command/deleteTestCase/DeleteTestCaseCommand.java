package vantaCore.application.testCase.appliaction.command.deleteTestCase;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.TESTCASE_DELETE)
final public class DeleteTestCaseCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID ticketId;

    @NotNull
    private final UUID testCaseId;

    public DeleteTestCaseCommand(UUID projectId, UUID ticketId, UUID testCaseId) {
        this.projectId = projectId;
        this.ticketId = ticketId;
        this.testCaseId = testCaseId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getTicketId() {
        return ticketId;
    }

    public UUID getTestCaseId() {
        return testCaseId;
    }
}
