package vantaCore.application.importExport.domain.repository;

import vantaCore.application.importExport.domain.ImportJobAggregate;
import vantaCore.application.importExport.domain.vo.ImportJobId;

import java.util.Optional;

public interface ImportJobRepositoryInterface {

    void save(ImportJobAggregate job);

    Optional<ImportJobAggregate> findById(ImportJobId id);
}
