package vantaCore.application.messageBus.middleware.handler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import vantaCore.application.messageBus.Envelope;
import vantaCore.application.messageBus.middleware.MiddlewareInterface;
import vantaCore.application.messageBus.middleware.middlewareStack.MiddlewareStackInterface;
import vantaCore.application.shared.application.event.AsyncEvent;

import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executor;

/**
 * Unlike HandlerMiddleware (exactly one handler per message type - command/query semantics), events
 * are fan-out: any number of listeners can react to the same event type, so this keeps a List per
 * message class and invokes every one of them instead of looking up a single handler.
 *
 * Routing: a message implementing AsyncEvent has its handlers submitted to asyncExecutor instead of
 * called inline - dispatch() (and therefore the command/query handler that triggered it) returns
 * without waiting for them. Every other event still runs synchronously, same as before AsyncEvent
 * existed.
 */
public class EventHandlerMiddleware implements MiddlewareInterface {

    private static final Logger log = LoggerFactory.getLogger(EventHandlerMiddleware.class);

    private final Map<Class<?>, List<HandlerInterface<?, ?>>> handlersByType;
    private final Executor asyncExecutor;

    public EventHandlerMiddleware(List<? extends HandlerInterface<?, ?>> handlers, Executor asyncExecutor) {
        this.handlersByType = new HashMap<>();
        this.asyncExecutor = asyncExecutor;

        for (HandlerInterface<?, ?> handler : handlers) {
            Class<?> messageType = extractMessageType(handler);
            this.handlersByType.computeIfAbsent(messageType, type -> new ArrayList<>()).add(handler);
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public Envelope<Object, Object> handle(Envelope<Object, Object> envelope, MiddlewareStackInterface stack) throws Exception {

        Object message = envelope.getMessage();
        boolean async = message instanceof AsyncEvent;

        for (HandlerInterface<?, ?> handler : this.handlersByType.getOrDefault(message.getClass(), List.of())) {
            if (async) {
                dispatchAsync((HandlerInterface<Object, Object>) handler, message);
            } else {
                ((HandlerInterface<Object, Object>) handler).handle(message);
            }
        }

        envelope.setResult(null);

        return envelope;
    }

    // Exceptions from an async handler have no request to propagate to by the time they'd surface -
    // logged here instead of thrown, so one failing listener can't take down the pool thread
    // silently (and can't ever fail the original command/query that dispatched the event, unlike
    // the synchronous path).
    private void dispatchAsync(HandlerInterface<Object, Object> handler, Object message) {
        this.asyncExecutor.execute(() -> {
            try {
                handler.handle(message);
            } catch (Exception exception) {
                log.error(
                    "Async event handler {} failed for {}",
                    handler.getClass().getSimpleName(), message.getClass().getSimpleName(), exception
                );
            }
        });
    }

    private Class<?> extractMessageType(HandlerInterface<?, ?> handler) {

        Type[] interfaces = handler.getClass().getGenericInterfaces();
        for (Type type : interfaces) {
            if (type instanceof ParameterizedType pt) {
                return (Class<?>) pt.getActualTypeArguments()[0];
            }
        }

        throw new IllegalStateException("Cannot resolve handler type");
    }
}
