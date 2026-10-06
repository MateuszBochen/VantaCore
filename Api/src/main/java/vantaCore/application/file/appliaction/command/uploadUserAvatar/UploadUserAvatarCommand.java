package vantaCore.application.file.appliaction.command.uploadUserAvatar;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.file.appliaction.dto.FileUploadPayload;

import java.util.UUID;

final public class UploadUserAvatarCommand {

    @NotNull
    private final UUID avatarId;

    @NotNull
    private final FileUploadPayload payload;

    public UploadUserAvatarCommand(UUID avatarId, FileUploadPayload payload) {
        this.avatarId = avatarId;
        this.payload = payload;
    }

    public UUID getAvatarId() {
        return avatarId;
    }

    public FileUploadPayload getPayload() {
        return payload;
    }
}
