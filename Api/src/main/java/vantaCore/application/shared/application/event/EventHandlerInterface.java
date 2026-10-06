package vantaCore.application.shared.application.event;

import vantaCore.application.messageBus.middleware.handler.HandlerInterface;

/**
 * E - event type which is handled by this listener.
 * Unlike CommandHandlerInterface/QueryHandlerInterface, more than one EventHandlerInterface can
 * exist for the same event type (see EventHandlerMiddleware) - events are fan-out, not single-dispatch.
 */
public interface EventHandlerInterface<E> extends HandlerInterface<E, Void> {
}
