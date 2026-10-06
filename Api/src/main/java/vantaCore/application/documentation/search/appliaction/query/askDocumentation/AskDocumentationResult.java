package vantaCore.application.documentation.search.appliaction.query.askDocumentation;

import java.util.List;

public record AskDocumentationResult(String answer, List<AskDocumentationSourceResult> sources) {
}
