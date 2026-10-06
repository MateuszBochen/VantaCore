package vantaCore.application.testCase.domain.vo;

public enum TestCaseStatus {
    NOT_RUN,
    PASSED,
    FAILED,
    BLOCKED;

    /** "not-run" -> NOT_RUN */
    public static TestCaseStatus fromWireValue(String value) {
        return TestCaseStatus.valueOf(value.toUpperCase().replace('-', '_'));
    }

    /** NOT_RUN -> "not-run" */
    public String toWireValue() {
        return name().toLowerCase().replace('_', '-');
    }
}
