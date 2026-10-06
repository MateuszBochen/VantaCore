package vantaCore.application.subProject.appliaction.dto;

import jakarta.validation.Valid;

import java.util.List;

final public class SubProjectDocumentationRequest {

    private final String scope;
    private final String impactAnalysis;
    private final String solutionDesign;

    @Valid
    private final List<AdrRequest> adrs;

    public SubProjectDocumentationRequest(
        String scope,
        String impactAnalysis,
        String solutionDesign,
        List<AdrRequest> adrs
    ) {
        this.scope = scope;
        this.impactAnalysis = impactAnalysis;
        this.solutionDesign = solutionDesign;
        this.adrs = adrs;
    }

    public String getScope() {
        return scope;
    }

    public String getImpactAnalysis() {
        return impactAnalysis;
    }

    public String getSolutionDesign() {
        return solutionDesign;
    }

    public List<AdrRequest> getAdrs() {
        return adrs;
    }
}
