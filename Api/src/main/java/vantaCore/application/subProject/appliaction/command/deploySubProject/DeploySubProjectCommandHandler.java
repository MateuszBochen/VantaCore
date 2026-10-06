package vantaCore.application.subProject.appliaction.command.deploySubProject;

import org.springframework.stereotype.Component;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;
import vantaCore.application.subProject.domain.SubProjectAggregate;
import vantaCore.application.subProject.domain.exception.SubProjectNotFoundException;
import vantaCore.application.subProject.domain.policy.DeploySubProjectPolicy;
import vantaCore.application.subProject.domain.repository.SubProjectRepositoryInterface;
import vantaCore.application.subProject.domain.vo.SubProjectId;
import vantaCore.application.subProject.domain.vo.SubProjectStatus;
import vantaCore.application.user.domain.UserAggregate;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface;
import vantaCore.application.user.domain.vo.UserId;

import java.time.Instant;
import java.util.UUID;

@Component
final public class DeploySubProjectCommandHandler implements CommandHandlerInterface<DeploySubProjectCommand> {

    private final DeploySubProjectPolicy deploySubProjectPolicy;
    private final SubProjectRepositoryInterface repository;
    private final ProjectAggregateRepositoryInterface projectRepository;
    private final CurrentUserProviderInterface currentUserProvider;
    private final UserAggregateRepositoryInterface userRepository;

    public DeploySubProjectCommandHandler(
        DeploySubProjectPolicy deploySubProjectPolicy,
        SubProjectRepositoryInterface repository,
        ProjectAggregateRepositoryInterface projectRepository,
        CurrentUserProviderInterface currentUserProvider,
        UserAggregateRepositoryInterface userRepository
    ) {
        this.deploySubProjectPolicy = deploySubProjectPolicy;
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.currentUserProvider = currentUserProvider;
        this.userRepository = userRepository;
    }

    @Override
    public Void handle(DeploySubProjectCommand command) {
        ProjectId projectId = new ProjectId(command.getProjectId());
        SubProjectId subProjectId = new SubProjectId(command.getSubProjectId());

        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        SubProjectAggregate latest = this.repository.findLatestBySubProjectId(projectId, subProjectId)
            .orElseThrow(SubProjectNotFoundException::new);

        this.deploySubProjectPolicy.check(latest).assertAllowed();

        UserId currentUserId = this.currentUserProvider.getCurrentUserId();
        UserAggregate currentUser = this.userRepository.findById(currentUserId);

        SubProjectAggregate deployed = new SubProjectAggregate(
            UUID.randomUUID(),
            subProjectId,
            projectId,
            latest.getName(),
            SubProjectStatus.DEPLOYED,
            latest.getDocumentation(),
            currentUser.getId(),
            currentUser.getCredentials().email(),
            Instant.now()
        );

        this.repository.save(deployed);

        return null;
    }
}
