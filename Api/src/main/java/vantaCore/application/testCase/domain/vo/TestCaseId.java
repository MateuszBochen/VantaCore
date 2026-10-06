package vantaCore.application.testCase.domain.vo;

import java.util.UUID;

public record TestCaseId(UUID value) {

    public TestCaseId {
        if (value == null) {
            throw new IllegalArgumentException("TestCaseId cannot be null");
        }
    }

    @Override
    public String toString() {
        return this.value.toString();
    }
}
