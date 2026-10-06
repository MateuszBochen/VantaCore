package vantaCore.application.documentation.platform.appliaction.dto;

import jakarta.validation.Valid;

import java.util.List;

final public class UpsertPlatformDocumentationRequest {

    private final String architectureOverview;
    private final String api;

    @Valid
    private final List<DomainRequest> domains;

    @Valid
    private final List<GraphEdgeRequest> domainEdges;

    @Valid
    private final List<BoundedContextRequest> boundedContexts;

    @Valid
    private final List<GraphEdgeRequest> boundedContextEdges;

    @Valid
    private final List<ComponentRequest> components;

    @Valid
    private final List<GraphEdgeRequest> componentEdges;

    @Valid
    private final List<DataFlowNodeRequest> dataFlowNodes;

    @Valid
    private final List<GraphEdgeRequest> dataFlowEdges;

    @Valid
    private final List<InfraClusterRequest> infraClusters;

    @Valid
    private final List<GraphEdgeRequest> infraClusterEdges;

    @Valid
    private final List<InfraServiceRequest> infraServices;

    @Valid
    private final List<GraphEdgeRequest> infraServiceEdges;

    public UpsertPlatformDocumentationRequest(
        String architectureOverview,
        String api,
        List<DomainRequest> domains,
        List<GraphEdgeRequest> domainEdges,
        List<BoundedContextRequest> boundedContexts,
        List<GraphEdgeRequest> boundedContextEdges,
        List<ComponentRequest> components,
        List<GraphEdgeRequest> componentEdges,
        List<DataFlowNodeRequest> dataFlowNodes,
        List<GraphEdgeRequest> dataFlowEdges,
        List<InfraClusterRequest> infraClusters,
        List<GraphEdgeRequest> infraClusterEdges,
        List<InfraServiceRequest> infraServices,
        List<GraphEdgeRequest> infraServiceEdges
    ) {
        this.architectureOverview = architectureOverview;
        this.api = api;
        this.domains = domains;
        this.domainEdges = domainEdges;
        this.boundedContexts = boundedContexts;
        this.boundedContextEdges = boundedContextEdges;
        this.components = components;
        this.componentEdges = componentEdges;
        this.dataFlowNodes = dataFlowNodes;
        this.dataFlowEdges = dataFlowEdges;
        this.infraClusters = infraClusters;
        this.infraClusterEdges = infraClusterEdges;
        this.infraServices = infraServices;
        this.infraServiceEdges = infraServiceEdges;
    }

    public String getArchitectureOverview() {
        return architectureOverview;
    }

    public String getApi() {
        return api;
    }

    public List<DomainRequest> getDomains() {
        return domains;
    }

    public List<GraphEdgeRequest> getDomainEdges() {
        return domainEdges;
    }

    public List<BoundedContextRequest> getBoundedContexts() {
        return boundedContexts;
    }

    public List<GraphEdgeRequest> getBoundedContextEdges() {
        return boundedContextEdges;
    }

    public List<ComponentRequest> getComponents() {
        return components;
    }

    public List<GraphEdgeRequest> getComponentEdges() {
        return componentEdges;
    }

    public List<DataFlowNodeRequest> getDataFlowNodes() {
        return dataFlowNodes;
    }

    public List<GraphEdgeRequest> getDataFlowEdges() {
        return dataFlowEdges;
    }

    public List<InfraClusterRequest> getInfraClusters() {
        return infraClusters;
    }

    public List<GraphEdgeRequest> getInfraClusterEdges() {
        return infraClusterEdges;
    }

    public List<InfraServiceRequest> getInfraServices() {
        return infraServices;
    }

    public List<GraphEdgeRequest> getInfraServiceEdges() {
        return infraServiceEdges;
    }
}
