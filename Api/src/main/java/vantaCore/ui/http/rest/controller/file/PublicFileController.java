package vantaCore.ui.http.rest.controller.file;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.InvalidMediaTypeException;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vantaCore.application.file.appliaction.FileContentLoader;
import vantaCore.application.file.appliaction.PublicFileUrl;
import vantaCore.application.file.domain.vo.FileId;
import vantaCore.application.file.domain.vo.FileOwnerType;
import vantaCore.application.shared.application.exception.StoredFileNotFoundException;

import java.util.UUID;

/**
 * Deliberately under /web-api (permitAll, see SecurityConfig) - USER_AVATAR/EDITOR_IMAGE files need
 * to render in plain &lt;img src&gt; tags, which can't carry an Authorization header. "Security" here
 * is the unguessable UUID in the path, same trust model as e.g. a Google Drive share link. Ticket
 * attachments are NOT served here - they stay behind TicketAttachmentController's authenticated
 * /api/** download endpoint.
 */
@RestController
@RequestMapping(PublicFileUrl.PATH_PREFIX)
final public class PublicFileController {

    private final FileContentLoader fileContentLoader;

    PublicFileController(FileContentLoader fileContentLoader) {
        this.fileContentLoader = fileContentLoader;
    }

    @GetMapping("/{fileId}")
    public ResponseEntity<InputStreamResource> getFile(@PathVariable UUID fileId) {
        FileContentLoader.Loaded loaded = this.fileContentLoader.load(new FileId(fileId));

        if (loaded.file().ownerType() != FileOwnerType.USER_AVATAR && loaded.file().ownerType() != FileOwnerType.EDITOR_IMAGE) {
            throw new StoredFileNotFoundException();
        }

        return ResponseEntity.ok()
            .contentType(contentTypeOf(loaded.file().contentType()))
            .contentLength(loaded.file().sizeBytes())
            .body(new InputStreamResource(loaded.content()));
    }

    private MediaType contentTypeOf(String contentType) {
        try {
            return contentType != null ? MediaType.parseMediaType(contentType) : MediaType.APPLICATION_OCTET_STREAM;
        } catch (InvalidMediaTypeException exception) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }
}
