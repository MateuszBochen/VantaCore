package vantaCore.application.importExport.appliaction.query.previewImportConnection;

import org.springframework.stereotype.Component;
import vantaCore.application.importExport.appliaction.service.ExternalImportSourceRegistry;
import vantaCore.application.importExport.domain.ImportConnectionSnapshot;
import vantaCore.application.importExport.domain.repository.ImportConnectionRepositoryInterface;
import vantaCore.application.importExport.domain.source.ExternalImportSourceInterface;
import vantaCore.application.importExport.domain.source.ImportPreview;
import vantaCore.application.importExport.domain.vo.ImportConnectionId;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.exception.ImportConnectionNotFoundException;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;

@Component
final public class PreviewImportConnectionQueryHandler
    implements QueryHandlerInterface<PreviewImportConnectionQuery, Item<ImportPreviewResult>> {

    private final ProjectAggregateRepositoryInterface projectRepository;
    private final ImportConnectionRepositoryInterface connectionRepository;
    private final ExternalImportSourceRegistry sourceRegistry;

    public PreviewImportConnectionQueryHandler(
        ProjectAggregateRepositoryInterface projectRepository,
        ImportConnectionRepositoryInterface connectionRepository,
        ExternalImportSourceRegistry sourceRegistry
    ) {
        this.projectRepository = projectRepository;
        this.connectionRepository = connectionRepository;
        this.sourceRegistry = sourceRegistry;
    }

    @Override
    public Item<ImportPreviewResult> handle(PreviewImportConnectionQuery query) {
        this.projectRepository.findById(new ProjectId(query.getProjectId())).orElseThrow(ProjectNotFoundException::new);

        ImportConnectionSnapshot connection = this.connectionRepository.findById(new ImportConnectionId(query.getConnectionId()))
            .orElseThrow(ImportConnectionNotFoundException::new);

        ExternalImportSourceInterface source = this.sourceRegistry.get(connection.provider());
        ImportPreview preview = source.preview(connection);

        ImportPreviewResult result = new ImportPreviewResult(preview.fields(), preview.rows(), preview.fieldValues());

        return Item.fromPayload(query.getConnectionId().toString(), result);
    }
}
