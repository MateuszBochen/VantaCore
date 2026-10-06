package vantaCore.application.messageBus;

import org.springframework.stereotype.Service;
import vantaCore.application.messageBus.middleware.MiddlewareInterface;
import vantaCore.application.messageBus.middleware.handler.HandlerInterface;

import java.util.List;

@Service
public class MessageBusFactory implements MessageBusFactoryInterface {

    public MessageBus getMessageBus(
        List<? extends MiddlewareInterface> middlewares,
        List<? extends HandlerInterface<?, ?>> handlers
    ) {
        return new MessageBus(middlewares, handlers);
    }
}
