package vantaCore.application.importExport.appliaction.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.importExport.domain.vo.ImportProvider;

import java.util.List;
import java.util.UUID;

/** Body shape for provider JIRA/AZURE_DEVOPS - see StartImportCsvRequest for the CSV
 multipart-fields equivalent (same mapping/valueMappings shape, different transport). */
final public class StartImportJsonRequest {

    @NotNull
    private final ImportProvider provider;

    @NotNull
    private final UUID connectionId;

    @NotEmpty
    @Valid
    private final List<FieldMappingRequest> mapping;

    @Valid
    private final List<ValueMappingRequest> valueMappings;

    public StartImportJsonRequest(
        ImportProvider provider,
        UUID connectionId,
        List<FieldMappingRequest> mapping,
        List<ValueMappingRequest> valueMappings
    ) {
        this.provider = provider;
        this.connectionId = connectionId;
        this.mapping = mapping;
        this.valueMappings = valueMappings;
    }

    public ImportProvider getProvider() {
        return provider;
    }

    public UUID getConnectionId() {
        return connectionId;
    }

    public List<FieldMappingRequest> getMapping() {
        return mapping;
    }

    public List<ValueMappingRequest> getValueMappings() {
        return valueMappings;
    }
}
