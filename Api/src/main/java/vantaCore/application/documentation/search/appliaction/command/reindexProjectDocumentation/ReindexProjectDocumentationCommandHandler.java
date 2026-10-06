package vantaCore.application.documentation.search.appliaction.command.reindexProjectDocumentation;

import org.springframework.stereotype.Component;
import vantaCore.application.documentation.platform.domain.repository.PlatformDocumentationRepositoryInterface;
import vantaCore.application.documentation.search.appliaction.service.PlatformDocumentationReindexer;
import vantaCore.application.documentation.search.appliaction.service.SubProjectDocumentationReindexer;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.subProject.domain.repository.SubProjectRepositoryInterface;
import vantaCore.application.subProject.domain.repository.SubProjectRepositoryInterface.SubProjectSummary;

// Backfill/manual trigger for content that was saved before the on-save reindexing existed, or to
// recover from a stale index. Reads PlatformDocumentationRepositoryInterface/SubProjectRepositoryInterface
// directly (both other modules) rather than through an event - this is a read-only lookup driving
// an immediate, synchronous response to the caller, same carve-out as
// UpsertTicketCommandHandler's checkAgainstActiveSprint.
@Component
final public class ReindexProjectDocumentationCommandHandler implements CommandHandlerInterface<ReindexProjectDocumentationCommand> {

    private final ProjectAggregateRepositoryInterface projectRepository;
    private final PlatformDocumentationRepositoryInterface platformDocumentationRepository;
    private final SubProjectRepositoryInterface subProjectRepository;
    private final PlatformDocumentationReindexer platformDocumentationReindexer;
    private final SubProjectDocumentationReindexer subProjectDocumentationReindexer;

    public ReindexProjectDocumentationCommandHandler(
        ProjectAggregateRepositoryInterface projectRepository,
        PlatformDocumentationRepositoryInterface platformDocumentationRepository,
        SubProjectRepositoryInterface subProjectRepository,
        PlatformDocumentationReindexer platformDocumentationReindexer,
        SubProjectDocumentationReindexer subProjectDocumentationReindexer
    ) {
        this.projectRepository = projectRepository;
        this.platformDocumentationRepository = platformDocumentationRepository;
        this.subProjectRepository = subProjectRepository;
        this.platformDocumentationReindexer = platformDocumentationReindexer;
        this.subProjectDocumentationReindexer = subProjectDocumentationReindexer;
    }

    @Override
    public Void handle(ReindexProjectDocumentationCommand command) {
        ProjectId projectId = new ProjectId(command.getProjectId());
        this.projectRepository.findById(projectId).orElseThrow(ProjectNotFoundException::new);

        this.platformDocumentationRepository.findLatestByProjectId(projectId)
            .ifPresent(this.platformDocumentationReindexer::reindex);

        for (SubProjectSummary summary : this.subProjectRepository.findAllLatestSummariesByProjectId(projectId)) {
            this.subProjectRepository.findLatestBySubProjectId(projectId, summary.id())
                .ifPresent(this.subProjectDocumentationReindexer::reindex);
        }

        return null;
    }
}
