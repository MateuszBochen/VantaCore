package vantaCore.application.project.domain.vo;

public record StartingNumber(int value) {

    public StartingNumber {
        if (value <= 0) {
            throw new IllegalArgumentException("Starting number must be greater than 0");
        }
    }
}
