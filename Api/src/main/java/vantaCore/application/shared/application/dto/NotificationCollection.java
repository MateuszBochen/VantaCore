package vantaCore.application.shared.application.dto;

import vantaCore.application.shared.application.exception.UnprocessableEntityException;

import java.util.ArrayList;
import java.util.List;

public class NotificationCollection {

    private final List<Notification> notifications;

    public NotificationCollection() {
        this.notifications = new ArrayList<Notification>();
    }

    public NotificationCollection(List<Notification> notifications) {
        this.notifications = List.copyOf(notifications);
    }

    public void append(Notification notification) {
        notifications.add(notification);
    }

    public List<Notification> getNotifications() {
        return notifications;
    }

    public boolean isAllowed() {
        return notifications.stream()
                .noneMatch(Notification::isBlocked);
    }

    public void assertAllowed() {
        List<Notification> blocked = notifications.stream()
                .filter(Notification::isBlocked)
                .toList();

        if (!blocked.isEmpty()) {
            throw new UnprocessableEntityException(blocked);
        }
    }
}
