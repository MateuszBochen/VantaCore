package vantaCore.application.shared.infrastructure.bus;

import org.springframework.stereotype.Service;
import vantaCore.application.messageBus.Envelope;
import vantaCore.application.messageBus.MessageBusFactoryInterface;
import vantaCore.application.messageBus.MessageBusInterface;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.application.shared.application.query.QueryHandlerInterface;
import vantaCore.application.shared.domain.bus.middleware.QueryMiddlewareInterface;

import java.util.List;

@Service
final public class QueryBus implements QueryBusInterface {

    private final MessageBusInterface messageBus;

    QueryBus(
        List<QueryMiddlewareInterface> middlewares,
        List<QueryHandlerInterface<?, ?>> handlers,
        MessageBusFactoryInterface messageBusFactory
    ) {
        this.messageBus = messageBusFactory.getMessageBus(middlewares, handlers);
    }

    @Override
    public <T, R> R ask(T query) throws Exception {
        Envelope<T, R> envelope = this.messageBus.dispatch(query);
        return envelope.getResult();
    }
}