package vantaCore.ui.http.rest.controller.file;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import vantaCore.application.file.appliaction.command.uploadEditorImage.UploadEditorImageCommand;
import vantaCore.application.file.appliaction.dto.FileUploadPayload;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Empty;

import java.util.UUID;

@RestController
@RequestMapping("/api/editor-image")
final public class EditorImageController {

    private final CommandBusInterface commandBus;

    EditorImageController(CommandBusInterface commandBus) {
        this.commandBus = commandBus;
    }

    @PostMapping(value = "/{imageId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public OpenApiResponse<Empty> uploadImage(
        @PathVariable UUID imageId,
        @RequestPart("file") MultipartFile file
    ) throws Exception {

        FileUploadPayload payload = new FileUploadPayload(file.getOriginalFilename(), file.getContentType(), file.getInputStream(), file.getSize());
        this.commandBus.handle(new UploadEditorImageCommand(imageId, payload));

        return OpenApiResponse.empty(HttpStatus.CREATED);
    }
}
