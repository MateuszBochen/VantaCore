package vantaCore.application.file.appliaction.command.uploadEditorImage;

import jakarta.validation.constraints.NotNull;
import vantaCore.application.file.appliaction.dto.FileUploadPayload;

import java.util.UUID;

final public class UploadEditorImageCommand {

    @NotNull
    private final UUID imageId;

    @NotNull
    private final FileUploadPayload payload;

    public UploadEditorImageCommand(UUID imageId, FileUploadPayload payload) {
        this.imageId = imageId;
        this.payload = payload;
    }

    public UUID getImageId() {
        return imageId;
    }

    public FileUploadPayload getPayload() {
        return payload;
    }
}
