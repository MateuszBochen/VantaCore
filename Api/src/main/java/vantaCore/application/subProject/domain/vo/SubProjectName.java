package vantaCore.application.subProject.domain.vo;

public record SubProjectName(String value) {

    public SubProjectName {
        if (value == null) {
            throw new IllegalArgumentException("Sub-project name cannot be null");
        }

        value = value.trim();

        if (value.isBlank()) {
            throw new IllegalArgumentException("Sub-project name cannot be blank");
        }
    }
}
