package vantaCore.application.subProject.domain.vo;

import java.util.Set;

public record SubProjectDocumentation(
    String scope,
    String impactAnalysis,
    String solutionDesign,
    Set<Adr> adrs
) {
    public SubProjectDocumentation {
        adrs = adrs == null ? Set.of() : Set.copyOf(adrs);
    }
}
