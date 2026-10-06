package vantaCore.application.documentation.platform.appliaction.command.upsertPlatformDocumentation;

import org.springframework.stereotype.Component;
import vantaCore.application.documentation.platform.appliaction.dto.BoundedContextRequest;
import vantaCore.application.documentation.platform.appliaction.dto.ComponentRequest;
import vantaCore.application.documentation.platform.appliaction.dto.DataFlowNodeRequest;
import vantaCore.application.documentation.platform.appliaction.dto.DomainRequest;
import vantaCore.application.documentation.platform.appliaction.dto.GraphEdgeRequest;
import vantaCore.application.documentation.platform.appliaction.dto.InfraClusterRequest;
import vantaCore.application.documentation.platform.appliaction.dto.InfraServiceRequest;
import vantaCore.application.documentation.platform.appliaction.dto.UpsertPlatformDocumentationRequest;
import vantaCore.application.documentation.platform.domain.PlatformDocumentationAggregate;
import vantaCore.application.documentation.platform.domain.event.PlatformDocumentationWasUpdated;
import vantaCore.application.documentation.platform.domain.policy.UpsertPlatformDocumentationPolicy;
import vantaCore.application.documentation.platform.domain.repository.PlatformDocumentationRepositoryInterface;
import vantaCore.application.documentation.platform.domain.vo.GraphEdge;
import vantaCore.application.documentation.platform.domain.vo.GraphNode;
import vantaCore.application.documentation.platform.domain.vo.PlatformGraph;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.event.EventBusInterface;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;
import vantaCore.application.user.domain.UserAggregate;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface;
import vantaCore.application.user.domain.vo.UserId;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
final public class UpsertPlatformDocumentationCommandHandler implements CommandHandlerInterface<UpsertPlatformDocumentationCommand> {

    private final UpsertPlatformDocumentationPolicy upsertPlatformDocumentationPolicy;
    private final PlatformDocumentationRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final CurrentUserProviderInterface currentUserProvider;
    private final UserAggregateRepositoryInterface userRepository;
    private final EventBusInterface eventBus;

    public UpsertPlatformDocumentationCommandHandler(
        UpsertPlatformDocumentationPolicy upsertPlatformDocumentationPolicy,
        PlatformDocumentationRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository,
        CurrentUserProviderInterface currentUserProvider,
        UserAggregateRepositoryInterface userRepository,
        EventBusInterface eventBus
    ) {
        this.upsertPlatformDocumentationPolicy = upsertPlatformDocumentationPolicy;
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.currentUserProvider = currentUserProvider;
        this.userRepository = userRepository;
        this.eventBus = eventBus;
    }

    @Override
    public Void handle(UpsertPlatformDocumentationCommand command) {
        ProjectId projectId = new ProjectId(command.getProjectId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        UserId currentUserId = this.currentUserProvider.getCurrentUserId();
        UserAggregate currentUser = this.userRepository.findById(currentUserId);

        UpsertPlatformDocumentationRequest request = command.getUpsertPlatformDocumentationRequest();

        PlatformGraph graph = new PlatformGraph(
            toDomainNodes(request.getDomains()),
            toEdges(request.getDomainEdges()),
            toBoundedContextNodes(request.getBoundedContexts()),
            toEdges(request.getBoundedContextEdges()),
            toComponentNodes(request.getComponents()),
            toEdges(request.getComponentEdges()),
            toDataFlowNodes(request.getDataFlowNodes()),
            toEdges(request.getDataFlowEdges()),
            toInfraClusterNodes(request.getInfraClusters()),
            toEdges(request.getInfraClusterEdges()),
            toInfraServiceNodes(request.getInfraServices()),
            toEdges(request.getInfraServiceEdges())
        );

        PlatformDocumentationAggregate documentation = new PlatformDocumentationAggregate(
            UUID.randomUUID(),
            projectId,
            request.getArchitectureOverview(),
            request.getApi(),
            graph,
            currentUser.getId(),
            currentUser.getCredentials().email(),
            Instant.now()
        );

        this.upsertPlatformDocumentationPolicy.check(documentation).assertAllowed();

        this.repository.save(documentation);

        // Reindexing (documentation.search module) is a side effect of this save, not this
        // handler's concern - see ReindexDocumentationWhenPlatformDocumentationWasUpdated.
        this.eventBus.dispatch(new PlatformDocumentationWasUpdated(documentation));

        return null;
    }

    private Set<GraphNode> toDomainNodes(List<DomainRequest> requests) {
        if (requests == null) {
            return Collections.emptySet();
        }

        return requests.stream()
            .map(request -> new GraphNode(request.getId(), request.getName(), request.getColor(), null, request.getDescription()))
            .collect(Collectors.toSet());
    }

    private Set<GraphNode> toBoundedContextNodes(List<BoundedContextRequest> requests) {
        if (requests == null) {
            return Collections.emptySet();
        }

        return requests.stream()
            .map(request -> new GraphNode(request.getId(), request.getName(), request.getColor(), request.getDomainId(), request.getDescription()))
            .collect(Collectors.toSet());
    }

    private Set<GraphNode> toComponentNodes(List<ComponentRequest> requests) {
        if (requests == null) {
            return Collections.emptySet();
        }

        return requests.stream()
            .map(request -> new GraphNode(request.getId(), request.getName(), request.getColor(), request.getBoundedContextId(), request.getDescription()))
            .collect(Collectors.toSet());
    }

    private Set<GraphNode> toDataFlowNodes(List<DataFlowNodeRequest> requests) {
        if (requests == null) {
            return Collections.emptySet();
        }

        return requests.stream()
            .map(request -> new GraphNode(request.getId(), request.getName(), request.getColor(), request.getComponentId(), request.getDescription()))
            .collect(Collectors.toSet());
    }

    private Set<GraphNode> toInfraClusterNodes(List<InfraClusterRequest> requests) {
        if (requests == null) {
            return Collections.emptySet();
        }

        return requests.stream()
            .map(request -> new GraphNode(request.getId(), request.getName(), request.getColor(), null, request.getDescription()))
            .collect(Collectors.toSet());
    }

    private Set<GraphNode> toInfraServiceNodes(List<InfraServiceRequest> requests) {
        if (requests == null) {
            return Collections.emptySet();
        }

        return requests.stream()
            .map(request -> new GraphNode(request.getId(), request.getName(), request.getColor(), request.getClusterId(), request.getDescription()))
            .collect(Collectors.toSet());
    }

    private Set<GraphEdge> toEdges(List<GraphEdgeRequest> requests) {
        if (requests == null) {
            return Collections.emptySet();
        }

        return requests.stream()
            .map(request -> new GraphEdge(request.getId(), request.getSource(), request.getTarget(), request.getLabel()))
            .collect(Collectors.toSet());
    }
}
