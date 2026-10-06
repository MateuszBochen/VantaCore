package vantaCore.application.shared.infrastructure.bus;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import vantaCore.application.messageBus.EventMessageBus;
import vantaCore.application.messageBus.MessageBusInterface;
import vantaCore.application.shared.application.event.EventBusInterface;
import vantaCore.application.shared.application.event.EventHandlerInterface;
import vantaCore.application.shared.domain.bus.middleware.EventMiddlewareInterface;

import java.util.List;
import java.util.concurrent.Executor;

@Service
final public class EventBus implements EventBusInterface {

    private final MessageBusInterface messageBus;

    /**
     * Inject all implementations of EventMiddlewareInterface
     * Inject all implementations of EventHandlerInterface<?>
     * asyncExecutor: see EventAsyncExecutorConfig / AsyncEvent.
     */
    EventBus(
        List<EventMiddlewareInterface> middlewares,
        List<EventHandlerInterface<?>> handlers,
        @Qualifier("eventAsyncExecutor") Executor asyncExecutor
    ) {
        this.messageBus = new EventMessageBus(middlewares, handlers, asyncExecutor);
    }

    @Override
    public <E> void dispatch(E event) {
        // dispatch() is called from inside command/query handlers, whose own handle() methods (per
        // HandlerInterface) declare no checked exceptions - unlike CommandBusInterface.handle/
        // QueryBusInterface.ask (called from controllers, which already declare `throws Exception`),
        // so the checked Exception from the underlying MessageBusInterface is wrapped here instead of
        // propagated, to keep every call site clean.
        try {
            this.messageBus.dispatch(event);
        } catch (RuntimeException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException("Failed to dispatch event " + event.getClass().getSimpleName(), exception);
        }
    }
}
