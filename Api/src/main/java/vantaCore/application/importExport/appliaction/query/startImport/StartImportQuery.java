package vantaCore.application.importExport.appliaction.query.startImport;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import vantaCore.application.importExport.domain.mapping.FieldMapping;
import vantaCore.application.importExport.domain.mapping.ValueMapping;
import vantaCore.application.importExport.domain.vo.ImportProvider;
import vantaCore.application.shared.domain.accessControl.RequiresResource;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.List;
import java.util.UUID;

// No single nested Request DTO to wrap (per CLAUDE.md's usual command/query shape) - CSV arrives as
// multipart form fields (mapping/valueMappings as raw JSON strings the controller parses by hand)
// while JIRA/AZURE_DEVOPS arrives as one JSON body (StartImportJsonRequest, auto-bound) - both
// branches converge into these same already-normalized fields at the controller boundary instead.
@RequiresResource(Resource.IMPORT_MANAGE)
final public class StartImportQuery {

    @NotNull
    private final UUID projectId;

    @NotNull
    private final ImportProvider provider;

    /** required for JIRA/AZURE_DEVOPS, null for CSV */
    private final UUID connectionId;

    /** required for CSV, null for JIRA/AZURE_DEVOPS */
    private final byte[] csvContent;

    @NotEmpty
    private final List<FieldMapping> mapping;

    private final List<ValueMapping> valueMappings;

    public StartImportQuery(
        UUID projectId,
        ImportProvider provider,
        UUID connectionId,
        byte[] csvContent,
        List<FieldMapping> mapping,
        List<ValueMapping> valueMappings
    ) {
        this.projectId = projectId;
        this.provider = provider;
        this.connectionId = connectionId;
        this.csvContent = csvContent;
        this.mapping = mapping;
        this.valueMappings = valueMappings;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public ImportProvider getProvider() {
        return provider;
    }

    public UUID getConnectionId() {
        return connectionId;
    }

    public byte[] getCsvContent() {
        return csvContent;
    }

    public List<FieldMapping> getMapping() {
        return mapping;
    }

    public List<ValueMapping> getValueMappings() {
        return valueMappings;
    }
}
