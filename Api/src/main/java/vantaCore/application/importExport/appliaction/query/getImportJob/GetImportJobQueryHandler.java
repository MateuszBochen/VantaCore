package vantaCore.application.importExport.appliaction.query.getImportJob;

import org.springframework.stereotype.Component;
import vantaCore.application.importExport.domain.ImportJobAggregate;
import vantaCore.application.importExport.domain.ImportJobSnapshot;
import vantaCore.application.importExport.domain.repository.ImportJobRepositoryInterface;
import vantaCore.application.importExport.domain.vo.ImportJobId;
import vantaCore.application.project.domain.repository.ProjectAggregateRepositoryInterface;
import vantaCore.application.project.domain.vo.ProjectId;
import vantaCore.application.shared.application.exception.ImportJobNotFoundException;
import vantaCore.application.shared.application.exception.ProjectNotFoundException;
import vantaCore.application.shared.application.query.Item;
import vantaCore.application.shared.application.query.QueryHandlerInterface;

@Component
final public class GetImportJobQueryHandler implements QueryHandlerInterface<GetImportJobQuery, Item<ImportJobResult>> {

    private final ProjectAggregateRepositoryInterface projectRepository;
    private final ImportJobRepositoryInterface jobRepository;

    public GetImportJobQueryHandler(
        ProjectAggregateRepositoryInterface projectRepository,
        ImportJobRepositoryInterface jobRepository
    ) {
        this.projectRepository = projectRepository;
        this.jobRepository = jobRepository;
    }

    @Override
    public Item<ImportJobResult> handle(GetImportJobQuery query) {
        this.projectRepository.findById(new ProjectId(query.getProjectId())).orElseThrow(ProjectNotFoundException::new);

        ImportJobAggregate job = this.jobRepository.findById(new ImportJobId(query.getImportJobId()))
            .orElseThrow(ImportJobNotFoundException::new);

        ImportJobSnapshot snapshot = job.toSnapshot();

        // projectId isn't cross-checked against the job's own - same "don't distinguish missing
        // from wrong-project" private-sub-resource stance as DeleteWorklogCommandHandler/
        // DeleteTicketCommandHandler, just read via 404 semantics here since this is a query.
        if (!snapshot.projectId().equals(query.getProjectId())) {
            throw new ImportJobNotFoundException();
        }

        ImportJobResult result = new ImportJobResult(snapshot.id().value(), snapshot.status(), snapshot.progress(), snapshot.report());

        return Item.fromPayload(snapshot.id().toString(), result);
    }
}
