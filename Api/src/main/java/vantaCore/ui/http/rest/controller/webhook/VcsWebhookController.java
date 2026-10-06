package vantaCore.ui.http.rest.controller.webhook;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.vcs.appliaction.service.VcsWebhookProcessor;
import vantaCore.application.vcs.domain.vo.VcsProvider;

import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/** Deliberately under /web-api (permitAll, see SecurityConfig) - GitHub/GitLab/Bitbucket/Azure
 DevOps can't carry our JWT, so this is verified purely by each provider's own signature scheme
 (see VcsWebhookProcessor/the per-provider VcsWebhookVerifierInterface), the same "unguessable
 id + its own trust model" shape as PublicFileController, not app authentication. Body is read as a
 raw String (not auto-deserialized) since signature verification needs the exact delivered bytes,
 not a re-serialized re-encoding of them. */
@RestController
@RequestMapping("/web-api/webhook/vcs")
final public class VcsWebhookController {

    private final VcsWebhookProcessor processor;

    VcsWebhookController(VcsWebhookProcessor processor) {
        this.processor = processor;
    }

    @PostMapping("/{provider}/{connectionId}")
    public ResponseEntity<Void> receive(
        @PathVariable String provider,
        @PathVariable UUID connectionId,
        @RequestParam(required = false) String token,
        @RequestBody(required = false) String rawBody,
        HttpServletRequest request
    ) {
        VcsProvider parsedProvider;
        try {
            parsedProvider = VcsProvider.valueOf(provider.toUpperCase());
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        boolean verified = this.processor.process(parsedProvider, connectionId, headersOf(request), token, rawBody == null ? "" : rawBody);

        return verified ? ResponseEntity.ok().build() : ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    private Map<String, String> headersOf(HttpServletRequest request) {
        Map<String, String> headers = new HashMap<>();

        Enumeration<String> names = request.getHeaderNames();
        while (names != null && names.hasMoreElements()) {
            String name = names.nextElement();
            headers.put(name.toLowerCase(), request.getHeader(name));
        }

        return headers;
    }
}
