package vantaCore.application.messageBus.middleware.middlewareStack;

import vantaCore.application.messageBus.Envelope;

public interface MiddlewareStackInterface {

    Envelope<Object, Object> next(Envelope<Object, Object> envelope) throws Exception;

}

