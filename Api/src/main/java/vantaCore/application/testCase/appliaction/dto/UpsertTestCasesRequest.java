package vantaCore.application.testCase.appliaction.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;

import java.util.List;

final public class UpsertTestCasesRequest {

    @Valid
    private final List<TestCaseItemRequest> testCases;

    // Explicit @JsonCreator/@JsonProperty - this is a single-argument constructor, which Jackson's
    // implicit creator detection is ambiguous about (see StartWorklogRequest/CommentRequest incidents).
    @JsonCreator
    public UpsertTestCasesRequest(@JsonProperty("testCases") List<TestCaseItemRequest> testCases) {
        this.testCases = testCases;
    }

    public List<TestCaseItemRequest> getTestCases() {
        return testCases;
    }
}
