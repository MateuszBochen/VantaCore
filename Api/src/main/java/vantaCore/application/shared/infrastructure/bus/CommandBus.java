package vantaCore.application.shared.infrastructure.bus;

import org.springframework.stereotype.Service;
import vantaCore.application.messageBus.MessageBusFactoryInterface;
import vantaCore.application.messageBus.MessageBusInterface;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.domain.bus.middleware.CommandMiddlewareInterface;
import java.util.List;

@Service
final public class CommandBus implements CommandBusInterface {

    /** message bus */
    private final MessageBusInterface messageBus;

    /**
     * Inject all implementations of CommandMiddlewareInterface
     * Inject all implementations of MiddlewareInterface<CommandMiddlewareInterface>> as list of CommandHandlerInterface
     */
    CommandBus(
        List<CommandMiddlewareInterface> middlewares,
        List<CommandHandlerInterface<?>> handlers,
        MessageBusFactoryInterface messageBusFactory
    ) {
        this.messageBus = messageBusFactory.getMessageBus(middlewares, handlers);
    }

    @Override
    public <T> void handle(T message) throws Exception {
        this.messageBus.dispatch(message);
    }
}
