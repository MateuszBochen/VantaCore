package vantaCore.application.testCase.appliaction.command.upsertTestCases;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;
import vantaCore.application.testCase.appliaction.dto.UpsertTestCasesRequest;

import java.util.UUID;

@RequiresResource(Resource.TESTCASE_MANAGE)
final public class UpsertTestCasesCommand {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final UUID ticketId;

    @Valid
    @NotNull
    private final UpsertTestCasesRequest upsertTestCasesRequest;

    public UpsertTestCasesCommand(UUID projectId, UUID ticketId, UpsertTestCasesRequest upsertTestCasesRequest) {
        this.projectId = projectId;
        this.ticketId = ticketId;
        this.upsertTestCasesRequest = upsertTestCasesRequest;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public UUID getTicketId() {
        return ticketId;
    }

    public UpsertTestCasesRequest getUpsertTestCasesRequest() {
        return upsertTestCasesRequest;
    }
}
