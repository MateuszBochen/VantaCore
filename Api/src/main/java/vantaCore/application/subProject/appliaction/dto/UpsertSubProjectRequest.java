package vantaCore.application.subProject.appliaction.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

final public class UpsertSubProjectRequest {

    @Size(max = 255)
    private final String name;

    @Valid
    private final SubProjectDocumentationRequest documentation;

    public UpsertSubProjectRequest(String name, SubProjectDocumentationRequest documentation) {
        this.name = name;
        this.documentation = documentation;
    }

    public String getName() {
        return name;
    }

    public SubProjectDocumentationRequest getDocumentation() {
        return documentation;
    }
}
