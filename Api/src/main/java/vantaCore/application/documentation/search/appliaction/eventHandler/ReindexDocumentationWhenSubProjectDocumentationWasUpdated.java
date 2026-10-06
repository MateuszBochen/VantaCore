package vantaCore.application.documentation.search.appliaction.eventHandler;

import org.springframework.stereotype.Component;
import vantaCore.application.documentation.search.appliaction.service.SubProjectDocumentationReindexer;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.subProject.domain.event.SubProjectDocumentationWasUpdated;
import vantaCore.application.subProject.domain.repository.SubProjectRepositoryInterface;

// Same shape as ReindexDocumentationWhenPlatformDocumentationWasUpdated - see that class for the
// AsyncEvent/re-fetch-latest reasoning, which applies here too.
@Component
public class ReindexDocumentationWhenSubProjectDocumentationWasUpdated implements EventHandlerInterface<SubProjectDocumentationWasUpdated> {

    private final SubProjectRepositoryInterface repository;
    private final SubProjectDocumentationReindexer reindexer;

    public ReindexDocumentationWhenSubProjectDocumentationWasUpdated(
        SubProjectRepositoryInterface repository,
        SubProjectDocumentationReindexer reindexer
    ) {
        this.repository = repository;
        this.reindexer = reindexer;
    }

    @Override
    public Void handle(SubProjectDocumentationWasUpdated event) {
        this.repository.findLatestBySubProjectId(event.subProject().getProjectId(), event.subProject().getSubProjectId())
            .ifPresent(this.reindexer::reindex);

        return null;
    }
}
