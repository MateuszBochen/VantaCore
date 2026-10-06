package vantaCore.ui.http.rest.response;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.exception.ClientException;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.Item;
import org.springframework.http.HttpStatus;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.core.env.Environment;


@RestControllerAdvice
public class RestExceptionHandler {

    private final Environment environment;

    public RestExceptionHandler(Environment environment) {
        this.environment = environment;
    }

    @ExceptionHandler(ClientException.class)
    public OpenApiResponse<?> clientException(ClientException exception) {
        List<Notification> notifications = exception.getNotifications();
        long collectionItems = notifications.size();
        AtomicInteger index = new AtomicInteger(0);

        List<Item<Notification>> items = new ArrayList<>();
        notifications.forEach(notification -> {
            items.add(
                Item.fromPayload(String.valueOf(index.getAndIncrement()), notification)
            );
        });

        Collection<Notification> collection = new Collection<>(
            0,
            collectionItems,
            collectionItems,
            items
        );
        return OpenApiResponse.many(collection, exception.getStatus());
    }

    @ExceptionHandler(Exception.class)
    public OpenApiResponse<?> handleUnknown(Exception exception) {
        boolean isDev = Arrays.asList(this.environment.getActiveProfiles()).contains("dev");

        Map<String, Object> payload = new HashMap<>();
        payload.put("message", exception.getMessage());

        if (isDev) {
            payload.put("meta", this.getStackTrace(exception));
        }

        Item<Map<String, Object>> exceptionItem = Item.fromPayload("Internal server error", payload);

        return OpenApiResponse.one(exceptionItem, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private String getStackTrace(Exception exception) {
        StringWriter sw = new StringWriter();
        exception.printStackTrace(new PrintWriter(sw));

        return sw.toString();
    }
}
