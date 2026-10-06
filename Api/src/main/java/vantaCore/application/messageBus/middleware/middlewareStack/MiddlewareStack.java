package vantaCore.application.messageBus.middleware.middlewareStack;

import vantaCore.application.messageBus.Envelope;
import vantaCore.application.messageBus.middleware.MiddlewareInterface;

import java.util.List;
import java.util.ListIterator;

/**
 * Implementation of Middleware stack
 */
public class MiddlewareStack implements MiddlewareStackInterface {

    private final ListIterator<MiddlewareInterface> iterator;

    public MiddlewareStack(List<MiddlewareInterface> middlewares) {
        this.iterator = middlewares.listIterator();
    }

    @Override
    public Envelope<Object, Object> next(Envelope<Object, Object> envelope) throws Exception {

        if (iterator.hasNext()) {
            return iterator.next().handle(envelope, this);
        }

        return envelope;
    }
}
