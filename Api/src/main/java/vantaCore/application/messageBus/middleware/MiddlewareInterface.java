package vantaCore.application.messageBus.middleware;

import vantaCore.application.messageBus.Envelope;
import vantaCore.application.messageBus.middleware.middlewareStack.MiddlewareStackInterface;

public interface MiddlewareInterface {
    Envelope<Object, Object> handle(Envelope<Object, Object> envelope, MiddlewareStackInterface stack) throws Exception;
}
