package vantaCore.application.vcs.infrastructure.webhook;

import com.fasterxml.jackson.databind.JsonNode;
import vantaCore.application.project.domain.ProjectAggregate;
import vantaCore.application.vcs.domain.vo.VcsProvider;

import java.util.Map;

/** One implementation per provider - deliberately NOT a shared "universal VCS event" abstraction
 (see this sub-project's own Impact Analysis risk note: fitting four genuinely different webhook
 shapes into one abstraction up front risks fitting none of them well). Each handler does its own
 JSON parsing and calls DevelopmentActivityRepositoryInterface.update directly per matched ticket. */
public interface VcsWebhookHandlerInterface {

    VcsProvider provider();

    /** headers keyed lower-case. Never throws for a payload/event type it doesn't recognize - an
     unhandled event is simply a no-op, not an error (the sender doesn't care and shouldn't get a
     failure response for delivering an event type this app doesn't act on). */
    void handle(ProjectAggregate project, Map<String, String> headers, JsonNode payload);
}
