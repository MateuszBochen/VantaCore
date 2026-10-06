package vantaCore.application.shared.domain.policy;

import vantaCore.application.shared.application.dto.NotificationCollection;

public interface PolicyInterface<T> {

    public NotificationCollection check(T value);
}
