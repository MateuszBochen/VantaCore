package vantaCore.application.subProject.appliaction.query.result;

import java.util.Set;

public record SubProjectDocumentationResult(
    String scope,
    String impactAnalysis,
    String solutionDesign,
    Set<AdrResult> adrs
) {
}
