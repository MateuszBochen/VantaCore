package vantaCore.application.documentation.search.domain.vo;

/** What a chunk was extracted from - PLATFORM_NODE covers all six PlatformGraph node levels
 (domain/boundedContext/component/dataFlowNode/infraCluster/infraService), one chunk per node's
 description, since none of them carry business rules distinguishing chunking behavior.

 SUB_PROJECT_* covers a sub-project's Project Docs (scope/impactAnalysis/solutionDesign are three
 separate markdown fields, kept distinct here so a citation in the UI can point at the right tab)
 and SUB_PROJECT_ADR for each individual ADR entry. */
public enum DocumentationSourceType {
    PLATFORM_NODE,
    ARCHITECTURE_OVERVIEW,
    API,
    SUB_PROJECT_SCOPE,
    SUB_PROJECT_IMPACT_ANALYSIS,
    SUB_PROJECT_SOLUTION_DESIGN,
    SUB_PROJECT_ADR
}
