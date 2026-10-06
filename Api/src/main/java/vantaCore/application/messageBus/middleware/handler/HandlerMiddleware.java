package vantaCore.application.messageBus.middleware.handler;

import vantaCore.application.messageBus.Envelope;
import vantaCore.application.messageBus.middleware.MiddlewareInterface;
import vantaCore.application.messageBus.middleware.middlewareStack.MiddlewareStackInterface;

import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class HandlerMiddleware implements MiddlewareInterface {

    private final Map<Class<?>, HandlerInterface<?, ?>> handlerMap;

    public HandlerMiddleware(List<? extends HandlerInterface<?, ?>> handlers) {

        this.handlerMap = new HashMap<>();

        for (HandlerInterface<?, ?> handler : handlers) {
            Class<?> messageType = extractMessageType(handler);
            handlerMap.put(messageType, handler);
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public Envelope<Object, Object> handle(Envelope<Object, Object> envelope, MiddlewareStackInterface stack) throws Exception {

        Object message = envelope.getMessage();

        HandlerInterface<Object, Object> handler = (HandlerInterface<Object, Object>) handlerMap.get(message.getClass());

        Object result = handler.handle(message);

        envelope.setResult(result);

        return envelope;
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
