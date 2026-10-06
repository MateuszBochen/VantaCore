package vantaCore.application.shared.infrastructure.middleware;

import org.springframework.stereotype.Service;
import vantaCore.application.messageBus.Envelope;
import vantaCore.application.messageBus.middleware.middlewareStack.MiddlewareStackInterface;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.bus.middleware.CommandMiddlewareInterface;
import vantaCore.application.shared.domain.bus.middleware.QueryMiddlewareInterface;
import vantaCore.application.shared.infrastructure.security.ResourceAuthorizationChecker;

@Service
public class ResourceAuthorizationMiddleware implements CommandMiddlewareInterface, QueryMiddlewareInterface {

    private final ResourceAuthorizationChecker checker;

    public ResourceAuthorizationMiddleware(ResourceAuthorizationChecker checker) {
        this.checker = checker;
    }

    @Override
    public Envelope<Object, Object> handle(Envelope<Object, Object> envelope, MiddlewareStackInterface stack) throws Exception {
        RequiresResource annotation = envelope.getMessage().getClass().getAnnotation(RequiresResource.class);

        if (annotation != null) {
            this.checker.assertGranted(annotation.value());
        }

        return stack.next(envelope);
    }
}
