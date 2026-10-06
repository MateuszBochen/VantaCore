package vantaCore.application.shared.infrastructure.middleware;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.springframework.stereotype.Service;
import vantaCore.application.messageBus.Envelope;
import vantaCore.application.messageBus.middleware.middlewareStack.MiddlewareStackInterface;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.dto.NotificationCollection;
import vantaCore.application.shared.domain.bus.middleware.CommandMiddlewareInterface;
import vantaCore.application.shared.domain.bus.middleware.QueryMiddlewareInterface;
import java.util.Set;

@Service
public class ValidationMiddleware implements CommandMiddlewareInterface, QueryMiddlewareInterface {

    private final Validator validator;

    public ValidationMiddleware(Validator validator) {
        this.validator = validator;
    }

    @Override
    public Envelope<Object, Object> handle(Envelope<Object, Object> envelope, MiddlewareStackInterface stack) throws Exception {

        Object message = envelope.getMessage();

        Set<ConstraintViolation<Object>> violations = validator.validate(message);

        if (!violations.isEmpty()) {
            this.formatErrors(violations);
        }

        return stack.next(envelope);
    }

    private void formatErrors(Set<ConstraintViolation<Object>> violations) {
        NotificationCollection notificationCollection = new NotificationCollection();

        for (ConstraintViolation<Object> v : violations) {
            notificationCollection.append(new Notification(v.getPropertyPath().toString(), v.getMessage(), true));
        }

        notificationCollection.assertAllowed();
    }
}
