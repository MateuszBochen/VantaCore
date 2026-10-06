package vantaCore.application.testCase.appliaction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

final public class TestCaseItemRequest {

    @NotNull
    private final UUID id;

    private final String title;
    private final List<String> steps;
    private final String expectedResult;

    @NotBlank
    private final String status;

    public TestCaseItemRequest(UUID id, String title, List<String> steps, String expectedResult, String status) {
        this.id = id;
        this.title = title;
        this.steps = steps;
        this.expectedResult = expectedResult;
        this.status = status;
    }

    public UUID getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public List<String> getSteps() {
        return steps;
    }

    public String getExpectedResult() {
        return expectedResult;
    }

    public String getStatus() {
        return status;
    }
}
