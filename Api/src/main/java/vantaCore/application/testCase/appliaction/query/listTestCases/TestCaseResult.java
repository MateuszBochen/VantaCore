package vantaCore.application.testCase.appliaction.query.listTestCases;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TestCaseResult(
    UUID id,
    String title,
    List<String> steps,
    String expectedResult,
    String status,
    // Not in the example payload you gave, but you asked for these to be saved - exposed here for
    // the same reason as WorklogResult/CommentResult additions.
    Instant createdAt,
    TestCaseAuthorResult author
) {
}
