package vantaCore.application.file.domain.policy;

import org.springframework.stereotype.Component;
import vantaCore.application.file.domain.vo.FileOwnerType;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.dto.NotificationCollection;
import vantaCore.application.shared.domain.policy.PolicyInterface;

@Component
final public class FileUploadPolicy implements PolicyInterface<FileUploadCheck> {

    private static final long MAX_ATTACHMENT_SIZE_BYTES = 25L * 1024 * 1024;
    private static final long MAX_IMAGE_SIZE_BYTES = 5L * 1024 * 1024;

    @Override
    public NotificationCollection check(FileUploadCheck value) {
        NotificationCollection notifications = new NotificationCollection();
        boolean isImageOwner = isImageOwner(value.ownerType());

        if (isImageOwner && (value.contentType() == null || !value.contentType().startsWith("image/"))) {
            notifications.append(new Notification(
                "file-must-be-image",
                "Only image files are allowed here",
                true
            ));
        }

        long maxSize = isImageOwner ? MAX_IMAGE_SIZE_BYTES : MAX_ATTACHMENT_SIZE_BYTES;

        if (value.sizeBytes() > maxSize) {
            notifications.append(new Notification(
                "file-too-large",
                "File exceeds the maximum allowed size of " + (maxSize / (1024 * 1024)) + "MB",
                true
            ));
        }

        return notifications;
    }

    private boolean isImageOwner(FileOwnerType ownerType) {
        return ownerType == FileOwnerType.USER_AVATAR || ownerType == FileOwnerType.EDITOR_IMAGE;
    }
}
