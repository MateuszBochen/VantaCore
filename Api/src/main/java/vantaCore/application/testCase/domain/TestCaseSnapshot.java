package vantaCore.application.testCase.domain;

import vantaCore.application.testCase.domain.vo.TestCaseId;
import vantaCore.application.testCase.domain.vo.TestCaseStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TestCaseSnapshot(
    TestCaseId id,
    UUID ticketId,
    UUID authorId,
    String title,
    List<String> steps,
    String expectedResult,
    TestCaseStatus status,
    Instant createdAt
) {
}
