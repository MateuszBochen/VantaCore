package vantaCore.application.shared.infrastructure.middleware;

import org.springframework.transaction.support.TransactionTemplate;
import vantaCore.application.messageBus.Envelope;
import vantaCore.application.messageBus.middleware.middlewareStack.MiddlewareStackInterface;
import vantaCore.application.shared.domain.bus.middleware.CommandMiddlewareInterface;

public class TransactionMiddleware implements CommandMiddlewareInterface {
    private final TransactionTemplate transactionTemplate;

    public TransactionMiddleware(TransactionTemplate transactionTemplate) {
        this.transactionTemplate = transactionTemplate;
    }

    @Override
    public Envelope<Object, Object> handle(
            Envelope<Object, Object> envelope,
            MiddlewareStackInterface stack
    ) throws Exception {

        return transactionTemplate.execute(status -> {
            try {
                return stack.next(envelope);

            } catch (Exception e) {

                status.setRollbackOnly();

                throw new RuntimeException(e);
            }
        });
    }
}
