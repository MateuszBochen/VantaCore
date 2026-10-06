package vantaCore.application.messageBus;

import vantaCore.application.messageBus.middleware.MiddlewareInterface;
import vantaCore.application.messageBus.middleware.handler.EventHandlerMiddleware;
import vantaCore.application.messageBus.middleware.handler.HandlerInterface;
import vantaCore.application.messageBus.middleware.middlewareStack.MiddlewareStack;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executor;

/**
 * Same shape as MessageBus, but terminates the pipeline in EventHandlerMiddleware (fan-out to every
 * matching handler) instead of HandlerMiddleware (exactly one handler per message type).
 */
public class EventMessageBus implements MessageBusInterface {

    private final List<MiddlewareInterface> middlewares;

    public EventMessageBus(
        List<? extends MiddlewareInterface> middlewares,
        List<? extends HandlerInterface<?, ?>> handlers,
        Executor asyncExecutor
    ) {

        List<MiddlewareInterface> pipeline = new ArrayList<>(middlewares);

        pipeline.add(new EventHandlerMiddleware(handlers, asyncExecutor));

        this.middlewares = List.copyOf(pipeline);
    }

    @Override
    @SuppressWarnings("unchecked")
    public <M, R> Envelope<M, R> dispatch(M message) throws Exception {

        Envelope<Object, Object> envelope = new Envelope<>(message);

        MiddlewareStack stack = new MiddlewareStack(middlewares);

        return (Envelope<M, R>) stack.next(envelope);
    }
}
