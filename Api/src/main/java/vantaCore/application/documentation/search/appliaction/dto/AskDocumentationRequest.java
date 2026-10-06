package vantaCore.application.documentation.search.appliaction.dto;

import jakarta.validation.constraints.NotBlank;
import vantaCore.application.documentation.search.domain.vo.DocumentationSearchScope;

final public class AskDocumentationRequest {

    @NotBlank
    private final String question;

    // null = PROJECT (the handler defaults it) - most callers ask about the project they're
    // already looking at, so this stays optional rather than forcing every call site to pass it.
    private final DocumentationSearchScope scope;

    public AskDocumentationRequest(String question, DocumentationSearchScope scope) {
        this.question = question;
        this.scope = scope;
    }

    public String getQuestion() {
        return question;
    }

    public DocumentationSearchScope getScope() {
        return scope;
    }
}
