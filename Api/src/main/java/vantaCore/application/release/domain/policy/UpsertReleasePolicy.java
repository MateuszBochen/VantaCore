package vantaCore.application.release.domain.policy;

import org.springframework.stereotype.Component;
import vantaCore.application.release.domain.ReleaseAggregate;
import vantaCore.application.release.domain.repository.ReleaseAggregateRepositoryInterface;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.dto.NotificationCollection;
import vantaCore.application.shared.domain.policy.PolicyInterface;

@Component
final public class UpsertReleasePolicy implements PolicyInterface<UpsertReleaseCheck> {

    private final ReleaseAggregateRepositoryInterface repository;

    public UpsertReleasePolicy(ReleaseAggregateRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public NotificationCollection check(UpsertReleaseCheck value) {
        NotificationCollection notificationCollection = new NotificationCollection();

        boolean duplicate = this.repository.findAllByProjectId(value.projectId()).stream()
            .map(ReleaseAggregate::toSnapshot)
            .anyMatch(release -> !release.id().equals(value.releaseId())
                && release.versionNumber().equalsIgnoreCase(value.versionNumber()));

        if (duplicate) {
            notificationCollection.append(new Notification(
                "release-version-already-exists",
                "A release with this version number already exists for this project",
                true
            ));
        }

        return notificationCollection;
    }
}
