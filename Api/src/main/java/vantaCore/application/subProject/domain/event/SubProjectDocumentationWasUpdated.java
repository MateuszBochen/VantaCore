package vantaCore.application.subProject.domain.event;

import vantaCore.application.shared.application.event.AsyncEvent;
import vantaCore.application.subProject.domain.SubProjectAggregate;

/** Fired on every sub-project save (create or edit) - the reacting side (documentation.search
 module) reindexes the whole sub-project's chunk set from scratch on each occurrence, same as
 PlatformDocumentationWasUpdated; a no-op re-save just reindexes the same content again.

 AsyncEvent: same reasoning as PlatformDocumentationWasUpdated - reindexing is a slow Ollama call
 that shouldn't add latency to (or be able to fail) the sub-project save itself. Its handler
 re-reads the latest version from the repository rather than trusting subProject above, so
 out-of-order execution between two close-together saves still converges correctly. */
public record SubProjectDocumentationWasUpdated(SubProjectAggregate subProject) implements AsyncEvent {
}
