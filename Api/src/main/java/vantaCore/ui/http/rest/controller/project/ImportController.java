package vantaCore.ui.http.rest.controller.project;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.CollectionType;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import vantaCore.application.importExport.appliaction.dto.CreateImportConnectionRequest;
import vantaCore.application.importExport.appliaction.dto.FieldMappingRequest;
import vantaCore.application.importExport.appliaction.dto.StartImportJsonRequest;
import vantaCore.application.importExport.appliaction.dto.ValueMappingRequest;
import vantaCore.application.importExport.appliaction.query.createImportConnection.CreateImportConnectionQuery;
import vantaCore.application.importExport.appliaction.query.createImportConnection.ImportConnectionResult;
import vantaCore.application.importExport.appliaction.query.getImportJob.GetImportJobQuery;
import vantaCore.application.importExport.appliaction.query.getImportJob.ImportJobResult;
import vantaCore.application.importExport.appliaction.query.previewImportConnection.ImportPreviewResult;
import vantaCore.application.importExport.appliaction.query.previewImportConnection.PreviewImportConnectionQuery;
import vantaCore.application.importExport.appliaction.query.startImport.StartImportQuery;
import vantaCore.application.importExport.appliaction.query.startImport.StartImportResult;
import vantaCore.application.importExport.domain.mapping.FieldMapping;
import vantaCore.application.importExport.domain.mapping.ValueMapping;
import vantaCore.application.importExport.domain.vo.ImportProvider;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.exception.UnprocessableEntityException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryBusInterface;
import vantaCore.ui.http.rest.response.OpenApiResponse;
import vantaCore.ui.http.rest.response.dto.Single;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/project/{projectId}/import")
final public class ImportController {

    private final QueryBusInterface queryBus;
    private final ObjectMapper objectMapper;

    ImportController(QueryBusInterface queryBus, ObjectMapper objectMapper) {
        this.queryBus = queryBus;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/connection")
    public OpenApiResponse<Single<ImportConnectionResult>> createConnection(
        @PathVariable UUID projectId,
        @RequestBody CreateImportConnectionRequest request
    ) throws Exception {

        Item<ImportConnectionResult> result = this.queryBus.ask(new CreateImportConnectionQuery(projectId, request));

        return OpenApiResponse.one(result, HttpStatus.CREATED);
    }

    @GetMapping("/connection/{connectionId}/preview")
    public OpenApiResponse<Single<ImportPreviewResult>> previewConnection(
        @PathVariable UUID projectId,
        @PathVariable UUID connectionId
    ) throws Exception {

        Item<ImportPreviewResult> result = this.queryBus.ask(new PreviewImportConnectionQuery(projectId, connectionId));

        return OpenApiResponse.one(result, HttpStatus.OK);
    }

    // CSV branch - multipart/form-data. mapping/valueMappings arrive as JSON-encoded string form
    // fields (not auto-bindable the way a JSON body's nested arrays are), parsed by hand below.
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public OpenApiResponse<Single<StartImportResult>> startCsvImport(
        @PathVariable UUID projectId,
        @RequestPart("file") MultipartFile file,
        @RequestParam String provider,
        @RequestParam String mapping,
        @RequestParam(required = false) String valueMappings
    ) throws Exception {

        if (!"CSV".equalsIgnoreCase(provider)) {
            throw new UnprocessableEntityException(List.of(new Notification(
                "invalid-provider",
                "This endpoint only accepts provider=CSV - use the JSON body variant for JIRA/AZURE_DEVOPS",
                true
            )));
        }

        StartImportQuery query = new StartImportQuery(
            projectId,
            ImportProvider.CSV,
            null,
            file.getBytes(),
            toFieldMappings(parseList(mapping, FieldMappingRequest.class)),
            toValueMappings(valueMappings == null ? List.of() : parseList(valueMappings, ValueMappingRequest.class))
        );

        Item<StartImportResult> result = this.queryBus.ask(query);

        return OpenApiResponse.one(result, HttpStatus.CREATED);
    }

    // JIRA/AZURE_DEVOPS branch - plain JSON body, referencing an already-created connection.
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public OpenApiResponse<Single<StartImportResult>> startExternalImport(
        @PathVariable UUID projectId,
        @RequestBody StartImportJsonRequest request
    ) throws Exception {

        StartImportQuery query = new StartImportQuery(
            projectId,
            request.getProvider(),
            request.getConnectionId(),
            null,
            toFieldMappings(request.getMapping()),
            toValueMappings(request.getValueMappings() == null ? List.of() : request.getValueMappings())
        );

        Item<StartImportResult> result = this.queryBus.ask(query);

        return OpenApiResponse.one(result, HttpStatus.CREATED);
    }

    @GetMapping("/{importJobId}")
    public OpenApiResponse<Single<ImportJobResult>> getImportJob(
        @PathVariable UUID projectId,
        @PathVariable UUID importJobId
    ) throws Exception {

        Item<ImportJobResult> result = this.queryBus.ask(new GetImportJobQuery(projectId, importJobId));

        return OpenApiResponse.one(result, HttpStatus.OK);
    }

    private <T> List<T> parseList(String json, Class<T> type) {
        CollectionType listType = this.objectMapper.getTypeFactory().constructCollectionType(List.class, type);

        try {
            return this.objectMapper.readValue(json, listType);
        } catch (IOException exception) {
            throw new UnprocessableEntityException(List.of(new Notification(
                "invalid-mapping-json",
                "mapping/valueMappings must be valid JSON",
                true
            )));
        }
    }

    private List<FieldMapping> toFieldMappings(List<FieldMappingRequest> requests) {
        return requests.stream().map(r -> new FieldMapping(r.getSourceField(), r.getTargetField())).toList();
    }

    private List<ValueMapping> toValueMappings(List<ValueMappingRequest> requests) {
        return requests.stream().map(r -> new ValueMapping(r.getSourceValue(), r.getTargetId())).toList();
    }
}
