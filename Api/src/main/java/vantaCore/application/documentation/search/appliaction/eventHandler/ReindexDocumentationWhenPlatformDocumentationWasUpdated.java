package vantaCore.application.documentation.search.appliaction.eventHandler;

import org.springframework.stereotype.Component;
import vantaCore.application.documentation.platform.domain.event.PlatformDocumentationWasUpdated;
import vantaCore.application.documentation.platform.domain.repository.PlatformDocumentationRepositoryInterface;
import vantaCore.application.documentation.search.appliaction.service.PlatformDocumentationReindexer;
import vantaCore.application.shared.application.event.EventHandlerInterface;

// PlatformDocumentationWasUpdated is AsyncEvent-routed (runs on a background thread, see
// EventHandlerMiddleware/EventAsyncExecutorConfig) - embedding a typical documentation save's
// chunks on CPU is slow enough that it shouldn't add latency to (or be able to fail) the PUT it
// fires from.
@Component
public class ReindexDocumentationWhenPlatformDocumentationWasUpdated implements EventHandlerInterface<PlatformDocumentationWasUpdated> {

    private final PlatformDocumentationRepositoryInterface repository;
    private final PlatformDocumentationReindexer reindexer;

    public ReindexDocumentationWhenPlatformDocumentationWasUpdated(
        PlatformDocumentationRepositoryInterface repository,
        PlatformDocumentationReindexer reindexer
    ) {
        this.repository = repository;
        this.reindexer = reindexer;
    }

    @Override
    public Void handle(PlatformDocumentationWasUpdated event) {
        // Re-fetch the latest version rather than trust event.documentation() (a snapshot from
        // dispatch time) - async routing means two saves close together can have their handlers
        // run in either order, so always reindexing whatever is CURRENTLY latest is what makes the
        // final state converge to the right thing regardless of execution order.
        this.repository.findLatestByProjectId(event.documentation().getProjectId())
            .ifPresent(this.reindexer::reindex);

        return null;
    }
}
