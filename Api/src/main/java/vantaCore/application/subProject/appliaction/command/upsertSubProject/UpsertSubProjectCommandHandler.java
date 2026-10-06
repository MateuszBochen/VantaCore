package vantaCore.application.subProject.appliaction.command.upsertSubProject;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.event.EventBusInterface;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;
import vantaCore.application.subProject.appliaction.dto.AdrRequest;
import vantaCore.application.subProject.appliaction.dto.SubProjectDocumentationRequest;
import vantaCore.application.subProject.appliaction.dto.UpsertSubProjectRequest;
import vantaCore.application.subProject.domain.SubProjectAggregate;
import vantaCore.application.subProject.domain.event.SubProjectDocumentationWasUpdated;
import vantaCore.application.subProject.domain.policy.UpsertSubProjectPolicy;
import vantaCore.application.subProject.domain.repository.SubProjectRepositoryInterface;
import vantaCore.application.subProject.domain.vo.Adr;
import vantaCore.application.subProject.domain.vo.SubProjectDocumentation;
import vantaCore.application.subProject.domain.vo.SubProjectId;
import vantaCore.application.subProject.domain.vo.SubProjectName;
import vantaCore.application.subProject.domain.vo.SubProjectStatus;
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
final public class UpsertSubProjectCommandHandler implements CommandHandlerInterface<UpsertSubProjectCommand> {

    private final UpsertSubProjectPolicy upsertSubProjectPolicy;
    private final SubProjectRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final CurrentUserProviderInterface currentUserProvider;
    private final UserAggregateRepositoryInterface userRepository;
    private final EventBusInterface eventBus;

    public UpsertSubProjectCommandHandler(
        UpsertSubProjectPolicy upsertSubProjectPolicy,
        SubProjectRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository,
        CurrentUserProviderInterface currentUserProvider,
        UserAggregateRepositoryInterface userRepository,
        EventBusInterface eventBus
    ) {
        this.upsertSubProjectPolicy = upsertSubProjectPolicy;
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.currentUserProvider = currentUserProvider;
        this.userRepository = userRepository;
        this.eventBus = eventBus;
    }

    @Override
    public Void handle(UpsertSubProjectCommand command) {
        ProjectId projectId = new ProjectId(command.getProjectId());
        SubProjectId subProjectId = new SubProjectId(command.getSubProjectId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        SubProjectStatus status = this.repository.findLatestBySubProjectId(projectId, subProjectId)
            .map(SubProjectAggregate::getStatus)
            .orElse(SubProjectStatus.NOT_DEPLOYED);

        UserId currentUserId = this.currentUserProvider.getCurrentUserId();
        UserAggregate currentUser = this.userRepository.findById(currentUserId);

        UpsertSubProjectRequest request = command.getUpsertSubProjectRequest();

        SubProjectAggregate subProject = new SubProjectAggregate(
            UUID.randomUUID(),
            subProjectId,
            projectId,
            request.getName() != null ? new SubProjectName(request.getName()) : null,
            status,
            toDocumentation(request.getDocumentation()),
            currentUser.getId(),
            currentUser.getCredentials().email(),
            Instant.now()
        );

        this.upsertSubProjectPolicy.check(subProject).assertAllowed();

        this.repository.save(subProject);

        // Reindexing (documentation.search module) is a side effect of this save, not this
        // handler's concern - see ReindexDocumentationWhenSubProjectDocumentationWasUpdated.
        this.eventBus.dispatch(new SubProjectDocumentationWasUpdated(subProject));

        return null;
    }

    private SubProjectDocumentation toDocumentation(SubProjectDocumentationRequest request) {
        if (request == null) {
            return new SubProjectDocumentation(null, null, null, null);
        }

        return new SubProjectDocumentation(
            request.getScope(),
            request.getImpactAnalysis(),
            request.getSolutionDesign(),
            toAdrs(request.getAdrs())
        );
    }

    private Set<Adr> toAdrs(List<AdrRequest> requests) {
        if (requests == null) {
            return Collections.emptySet();
        }

        return requests.stream()
            .map(request -> new Adr(request.getId(), request.getTitle(), request.getContent()))
            .collect(Collectors.toSet());
    }
}
