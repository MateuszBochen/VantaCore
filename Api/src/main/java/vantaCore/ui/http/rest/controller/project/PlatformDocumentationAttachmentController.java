package vantaCore.ui.http.rest.controller.project;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.InvalidMediaTypeException;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import vantaCore.application.file.appliaction.FileContentLoader;
import vantaCore.application.file.appliaction.command.deletePlatformDocumentationAttachment.DeletePlatformDocumentationAttachmentCommand;
import vantaCore.application.file.appliaction.command.uploadPlatformDocumentationAttachment.UploadPlatformDocumentationAttachmentCommand;
import vantaCore.application.file.appliaction.dto.FileUploadPayload;
import vantaCore.application.file.appliaction.query.listPlatformDocumentationAttachments.ListPlatformDocumentationAttachmentsQuery;
import vantaCore.application.file.appliaction.query.listPlatformDocumentationAttachments.PlatformDocumentationAttachmentResult;
import vantaCore.application.file.domain.vo.FileId;
import vantaCore.application.shared.application.command.CommandBusInterface;
import vantaCore.application.shared.application.query.Collection;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Empty;
import vantaCore.ui.http.rest.response.dto.Many;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/project/{projectId}/documentation/attachment")
final public class PlatformDocumentationAttachmentController {

    private final CommandBusInterface commandBus;
    private final QueryBusInterface queryBus;
    private final FileContentLoader fileContentLoader;

    PlatformDocumentationAttachmentController(CommandBusInterface commandBus, QueryBusInterface queryBus, FileContentLoader fileContentLoader) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
        this.fileContentLoader = fileContentLoader;
    }

    @PostMapping(value = "/{attachmentId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public OpenApiResponse<Empty> uploadAttachment(
        @PathVariable UUID projectId,
        @PathVariable UUID attachmentId,
        @RequestPart("file") MultipartFile file
    ) throws Exception {

        this.commandBus.handle(new UploadPlatformDocumentationAttachmentCommand(projectId, attachmentId, toPayload(file)));

        return OpenApiResponse.empty(HttpStatus.CREATED);
    }

    @GetMapping
    public OpenApiResponse<Many<PlatformDocumentationAttachmentResult>> listAttachments(
        @PathVariable UUID projectId
    ) throws Exception {

        Collection<PlatformDocumentationAttachmentResult> result = this.queryBus.ask(new ListPlatformDocumentationAttachmentsQuery(projectId));

        return OpenApiResponse.many(result, HttpStatus.OK);
    }

    @GetMapping("/{attachmentId}/download")
    public ResponseEntity<InputStreamResource> downloadAttachment(
        @PathVariable UUID projectId,
        @PathVariable UUID attachmentId
    ) {
        FileContentLoader.Loaded loaded = this.fileContentLoader.load(new FileId(attachmentId));

        return ResponseEntity.ok()
            .contentType(contentTypeOf(loaded.file().contentType()))
            .contentLength(loaded.file().sizeBytes())
            .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                .filename(loaded.file().originalFilename())
                .build()
                .toString())
            .body(new InputStreamResource(loaded.content()));
    }

    @DeleteMapping("/{attachmentId}")
    public OpenApiResponse<Empty> deleteAttachment(
        @PathVariable UUID projectId,
        @PathVariable UUID attachmentId
    ) throws Exception {

        this.commandBus.handle(new DeletePlatformDocumentationAttachmentCommand(projectId, attachmentId));

        return OpenApiResponse.empty(HttpStatus.OK);
    }

    private FileUploadPayload toPayload(MultipartFile file) throws IOException {
        return new FileUploadPayload(file.getOriginalFilename(), file.getContentType(), file.getInputStream(), file.getSize());
    }

    private MediaType contentTypeOf(String contentType) {
        try {
            return contentType != null ? MediaType.parseMediaType(contentType) : MediaType.APPLICATION_OCTET_STREAM;
        } catch (InvalidMediaTypeException exception) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }
}
