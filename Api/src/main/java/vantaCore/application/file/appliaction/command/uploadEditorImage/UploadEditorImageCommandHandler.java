package vantaCore.application.file.appliaction.command.uploadEditorImage;

import org.springframework.stereotype.Component;
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
import vantaCore.application.user.domain.vo.UserId;

import java.time.Instant;

@Component
final public class UploadEditorImageCommandHandler implements CommandHandlerInterface<UploadEditorImageCommand> {

    private final FileAggregateRepositoryInterface repository;
    private final FileStorageInterface storage;
    private final FileUploadPolicy fileUploadPolicy;
    private final CurrentUserProviderInterface currentUserProvider;

    public UploadEditorImageCommandHandler(
        FileAggregateRepositoryInterface repository,
        FileStorageInterface storage,
        FileUploadPolicy fileUploadPolicy,
        CurrentUserProviderInterface currentUserProvider
    ) {
        this.repository = repository;
        this.storage = storage;
        this.fileUploadPolicy = fileUploadPolicy;
        this.currentUserProvider = currentUserProvider;
    }

    @Override
    public Void handle(UploadEditorImageCommand command) {
        FileUploadPayload payload = command.getPayload();

        this.fileUploadPolicy.check(
            new FileUploadCheck(FileOwnerType.EDITOR_IMAGE, payload.contentType(), payload.sizeBytes())
        ).assertAllowed();

        String storageKey = this.storage.store(
            StorageDirectory.editorImage(Instant.now()),
            new FileId(command.getImageId()),
            payload.content(),
            payload.originalFilename()
        );
        UserId currentUserId = this.currentUserProvider.getCurrentUserId();

        FileAggregate file = FileAggregate.newFile(
            new FileId(command.getImageId()),
            payload.originalFilename(),
            payload.contentType(),
            payload.sizeBytes(),
            storageKey,
            FileOwnerType.EDITOR_IMAGE,
            null,
            currentUserId.value(),
            Instant.now()
        );

        this.repository.save(file);

        return null;
    }
}
