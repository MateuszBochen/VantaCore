package vantaCore.application.testCase.domain;

import vantaCore.application.testCase.domain.vo.TestCaseId;
import vantaCore.application.testCase.domain.vo.TestCaseStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class TestCaseAggregate {
    private final TestCaseId id;
    private final UUID ticketId;
    private final UUID authorId;
    private final String title;
    private final List<String> steps;
    private final String expectedResult;
    private final TestCaseStatus status;
    private final Instant createdAt;

    private TestCaseAggregate(
        TestCaseId id,
        UUID ticketId,
        UUID authorId,
        String title,
        List<String> steps,
        String expectedResult,
        TestCaseStatus status,
        Instant createdAt
    ) {
        this.id = id;
        this.ticketId = ticketId;
        this.authorId = authorId;
        this.title = title;
        this.steps = steps == null ? List.of() : List.copyOf(steps);
        this.expectedResult = expectedResult;
        this.status = status;
        this.createdAt = createdAt;
    }

    /** A brand-new test case - also used to rebuild one from storage, since every field is supplied
     either way. */
    public static TestCaseAggregate newTestCase(
        TestCaseId id,
        UUID ticketId,
        UUID authorId,
        String title,
        List<String> steps,
        String expectedResult,
        TestCaseStatus status,
        Instant createdAt
    ) {
        return new TestCaseAggregate(id, ticketId, authorId, title, steps, expectedResult, status, createdAt);
    }

    /** Corrects title/steps/expectedResult/status - id/ticketId/authorId/createdAt are fixed for the
     test case's lifetime and always carry over from the current instance, never from the caller. */
    public TestCaseAggregate changeTestCase(
        String title,
        List<String> steps,
        String expectedResult,
        TestCaseStatus status
    ) {
        return new TestCaseAggregate(this.id, this.ticketId, this.authorId, title, steps, expectedResult, status, this.createdAt);
    }

    public TestCaseSnapshot toSnapshot() {
        return new TestCaseSnapshot(id, ticketId, authorId, title, steps, expectedResult, status, createdAt);
    }
}
