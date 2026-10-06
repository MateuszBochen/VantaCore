package vantaCore.ui.http.rest.controller.user;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import vantaCore.application.file.appliaction.command.uploadUserAvatar.UploadUserAvatarCommand;
import vantaCore.application.file.appliaction.dto.FileUploadPayload;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Empty;

import java.util.UUID;

@RestController
@RequestMapping("/api/user/avatar")
final public class UserAvatarController {

    private final CommandBusInterface commandBus;

    UserAvatarController(CommandBusInterface commandBus) {
        this.commandBus = commandBus;
    }

    @PostMapping(value = "/{avatarId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public OpenApiResponse<Empty> uploadAvatar(
        @PathVariable UUID avatarId,
        @RequestPart("file") MultipartFile file
    ) throws Exception {

        FileUploadPayload payload = new FileUploadPayload(file.getOriginalFilename(), file.getContentType(), file.getInputStream(), file.getSize());
        this.commandBus.handle(new UploadUserAvatarCommand(avatarId, payload));

        return OpenApiResponse.empty(HttpStatus.CREATED);
    }
}
