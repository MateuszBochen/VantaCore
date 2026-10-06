package vantaCore.application.project.domain.vo;

public record ProjectName(String value) {

    public ProjectName {
        if (value == null) {
            throw new IllegalArgumentException("Project name cannot be null");
        }

        value = value.trim();

        if (value.isBlank()) {
            throw new IllegalArgumentException("Project name cannot be blank");
        }
    }
}
