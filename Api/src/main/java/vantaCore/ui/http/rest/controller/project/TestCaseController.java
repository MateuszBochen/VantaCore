package vantaCore.ui.http.rest.controller.project;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.application.testCase.appliaction.command.deleteTestCase.DeleteTestCaseCommand;
import vantaCore.application.testCase.appliaction.command.upsertTestCases.UpsertTestCasesCommand;
import vantaCore.application.testCase.appliaction.dto.UpsertTestCasesRequest;
import vantaCore.application.testCase.appliaction.query.listTestCases.ListTestCasesQuery;
import vantaCore.application.testCase.appliaction.query.listTestCases.TestCaseResult;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Empty;
import vantaCore.ui.http.rest.response.dto.Many;

import java.util.UUID;

@RestController
@RequestMapping("/api/project/{projectId}/ticket/{ticketId}/testcase")
final public class TestCaseController {

    private final CommandBusInterface commandBus;
    private final QueryBusInterface queryBus;

    TestCaseController(CommandBusInterface commandBus, QueryBusInterface queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }

    @GetMapping
    public OpenApiResponse<Many<TestCaseResult>> listTestCases(
        @PathVariable UUID projectId,
        @PathVariable UUID ticketId
    ) throws Exception {

        Collection<TestCaseResult> result = this.queryBus.ask(new ListTestCasesQuery(projectId, ticketId));

        return OpenApiResponse.many(result, HttpStatus.OK);
    }

    @PutMapping
    public OpenApiResponse<Empty> upsertTestCases(
        @PathVariable UUID projectId,
        @PathVariable UUID ticketId,
        @RequestBody UpsertTestCasesRequest request
    ) throws Exception {

        this.commandBus.handle(new UpsertTestCasesCommand(projectId, ticketId, request));

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    @DeleteMapping("/{testCaseId}")
    public OpenApiResponse<Empty> deleteTestCase(
        @PathVariable UUID projectId,
        @PathVariable UUID ticketId,
        @PathVariable UUID testCaseId
    ) throws Exception {

        this.commandBus.handle(new DeleteTestCaseCommand(projectId, ticketId, testCaseId));

        return OpenApiResponse.empty(HttpStatus.OK);
    }
}
