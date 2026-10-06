package vantaCore.application.messageBus;

import vantaCore.application.messageBus.middleware.MiddlewareInterface;
import vantaCore.application.messageBus.middleware.handler.HandlerInterface;
import vantaCore.application.messageBus.middleware.handler.HandlerMiddleware;
import vantaCore.application.messageBus.middleware.middlewareStack.MiddlewareStack;

import java.util.ArrayList;
import java.util.List;

public class MessageBus implements MessageBusInterface {

    private final List<MiddlewareInterface> middlewares;

    public MessageBus(
            List<? extends MiddlewareInterface> middlewares,
            List<? extends HandlerInterface<?, ?>> handlers
    ) {

        List<MiddlewareInterface> pipeline = new ArrayList<>(middlewares);

        pipeline.add(new HandlerMiddleware(handlers));

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

