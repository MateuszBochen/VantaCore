package vantaCore.application.messageBus;

import vantaCore.application.messageBus.middleware.MiddlewareInterface;
import vantaCore.application.messageBus.middleware.handler.HandlerInterface;

import java.util.List;

public interface MessageBusFactoryInterface {

    public MessageBus getMessageBus(
        List<? extends MiddlewareInterface> middlewares,
        List<? extends HandlerInterface<?, ?>> handlers
    );
}
