package vantaCore.application.testCase.appliaction.query.listTestCases;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.UUID;

@RequiresResource(Resource.TESTCASE_VIEW)
final public class ListTestCasesQuery {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID ticketId;

    public ListTestCasesQuery(UUID projectId, UUID ticketId) {
        this.projectId = projectId;
        this.ticketId = ticketId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getTicketId() {
        return ticketId;
    }
}
