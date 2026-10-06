package vantaCore.application.file.appliaction.command.uploadUserAvatar;

import org.springframework.stereotype.Component;
import vantaCore.application.file.appliaction.PublicFileUrl;
import vantaCore.application.file.appliaction.dto.FileUploadPayload;
import vantaCore.application.file.domain.FileAggregate;
import vantaCore.application.file.domain.policy.FileUploadCheck;
import vantaCore.application.file.domain.policy.FileUploadPolicy;
import vantaCore.application.file.domain.repository.FileAggregateRepositoryInterface;
import vantaCore.application.file.domain.storage.FileStorageInterface;
import vantaCore.application.file.domain.storage.StorageDirectory;
import vantaCore.application.file.domain.vo.FileId;
import vantaCore.application.file.domain.vo.FileOwnerType;
import vantaCore.application.shared.application.command.CommandHandlerInterface;
import vantaCore.application.shared.application.security.CurrentUserProviderInterface;
import vantaCore.application.user.domain.UserAggregate;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface;
import vantaCore.application.user.domain.vo.UserId;
import vantaCore.application.user.domain.vo.UserProfile;

import java.time.Instant;

@Component
final public class UploadUserAvatarCommandHandler implements CommandHandlerInterface<UploadUserAvatarCommand> {

    private final FileAggregateRepositoryInterface repository;
    private final FileStorageInterface storage;
    private final UserAggregateRepositoryInterface userRepository;
    private final FileUploadPolicy fileUploadPolicy;
    private final CurrentUserProviderInterface currentUserProvider;

    public UploadUserAvatarCommandHandler(
        FileAggregateRepositoryInterface repository,
        FileStorageInterface storage,
        UserAggregateRepositoryInterface userRepository,
        FileUploadPolicy fileUploadPolicy,
        CurrentUserProviderInterface currentUserProvider
    ) {
        this.repository = repository;
        this.storage = storage;
        this.userRepository = userRepository;
        this.fileUploadPolicy = fileUploadPolicy;
        this.currentUserProvider = currentUserProvider;
    }

    @Override
    public Void handle(UploadUserAvatarCommand command) {
        UserId currentUserId = this.currentUserProvider.getCurrentUserId();
        FileUploadPayload payload = command.getPayload();

        this.fileUploadPolicy.check(
            new FileUploadCheck(FileOwnerType.USER_AVATAR, payload.contentType(), payload.sizeBytes())
        ).assertAllowed();

        deletePreviousAvatar(currentUserId);

        String storageKey = this.storage.store(
            StorageDirectory.userAvatar(currentUserId.value()),
            new FileId(command.getAvatarId()),
            payload.content(),
            payload.originalFilename()
        );
        FileId avatarId = new FileId(command.getAvatarId());

        FileAggregate file = FileAggregate.newFile(
            avatarId,
            payload.originalFilename(),
            payload.contentType(),
            payload.sizeBytes(),
            storageKey,
            FileOwnerType.USER_AVATAR,
            currentUserId.value(),
            currentUserId.value(),
            Instant.now()
        );

        this.repository.save(file);

        updateProfileAvatarUrl(currentUserId, PublicFileUrl.of(avatarId));

        return null;
    }

    // Re-uploading replaces the avatar rather than accumulating one row per upload - old blob and
    // metadata row are both removed first so storage doesn't leak orphaned files over time.
    private void deletePreviousAvatar(UserId userId) {
        for (FileAggregate previous : this.repository.findAllByOwner(FileOwnerType.USER_AVATAR, userId.value())) {
            var snapshot = previous.toSnapshot();
            this.storage.delete(snapshot.storageKey());
            this.repository.deleteById(snapshot.id());
        }
    }

    private void updateProfileAvatarUrl(UserId userId, String avatarUrl) {
        UserAggregate user = this.userRepository.findById(userId);
        UserProfile profile = user.getProfile();

        UserAggregate updated = new UserAggregate(
            user.getId(),
            user.getCredentials(),
            new UserProfile(profile.firstName(), profile.lastName(), avatarUrl),
            user.getRoleIds()
        );

        this.userRepository.save(updated);
    }
}
