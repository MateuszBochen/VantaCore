package vantaCore.application.subProject.domain.policy;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.dto.NotificationCollection;
import vantaCore.application.shared.domain.policy.PolicyInterface;
import vantaCore.application.subProject.domain.SubProjectAggregate;
import vantaCore.application.subProject.domain.vo.Adr;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Component
final public class UpsertSubProjectPolicy implements PolicyInterface<SubProjectAggregate> {

    @Override
    public NotificationCollection check(SubProjectAggregate subProject) {
        NotificationCollection notifications = new NotificationCollection();

        Set<UUID> seenAdrIds = new HashSet<>();

        for (Adr adr : subProject.getDocumentation().adrs()) {
            if (!seenAdrIds.add(adr.id())) {
                notifications.append(new Notification(
                    "duplicate-adr-id",
                    "Two ADRs share the same id",
                    true
                ));
            }
        }

        return notifications;
    }
}
