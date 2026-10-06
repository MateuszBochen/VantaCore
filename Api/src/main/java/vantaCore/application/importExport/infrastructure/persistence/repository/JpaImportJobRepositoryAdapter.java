package vantaCore.application.importExport.infrastructure.persistence.repository;

import org.springframework.stereotype.Repository;
import vantaCore.application.importExport.domain.ImportJobAggregate;
import vantaCore.application.importExport.domain.repository.ImportJobRepositoryInterface;
import vantaCore.application.importExport.domain.vo.ImportJobId;
import vantaCore.application.importExport.infrastructure.persistence.entity.ImportJobEntity;

import java.util.Optional;

@Repository
public class JpaImportJobRepositoryAdapter implements ImportJobRepositoryInterface {

    private final SpringDataImportJobRepositoryInterface repository;

    public JpaImportJobRepositoryAdapter(SpringDataImportJobRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public void save(ImportJobAggregate job) {
        this.repository.save(ImportJobEntity.fromDomain(job));
    }

    @Override
    public Optional<ImportJobAggregate> findById(ImportJobId id) {
        return this.repository.findById(id.value()).map(ImportJobEntity::toDomain);
    }
}
