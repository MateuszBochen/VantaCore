package vantaCore.application.documentation.platform.domain.event;

import vantaCore.application.documentation.platform.domain.PlatformDocumentationAggregate;
import vantaCore.application.shared.application.event.AsyncEvent;

/** Fired on every documentation save (create or edit) - the reacting side (documentation.search
 module) reindexes the whole project's chunk set from scratch on each occurrence, so unlike most
 events here there's no "only on genuine change" filtering; a no-op re-save just reindexes the same
 content again.

 AsyncEvent: reindexing calls Ollama (chunk embedding), which is slow enough on CPU to add real
 latency to the PUT this fires from - and an Ollama outage previously failed the whole save, not
 just the indexing. Its handler re-reads the latest version from the repository rather than
 trusting documentation above (see ReindexDocumentationWhenPlatformDocumentationWasUpdated), so
 out-of-order execution between two close-together saves still converges to the right result. */
public record PlatformDocumentationWasUpdated(PlatformDocumentationAggregate documentation) implements AsyncEvent {
}
