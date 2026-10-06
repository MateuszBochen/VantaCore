package vantaCore.application.importExport.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vantaCore.application.importExport.infrastructure.persistence.entity.ImportConnectionEntity;

import java.util.UUID;

public interface SpringDataImportConnectionRepositoryInterface extends JpaRepository<ImportConnectionEntity, UUID> {
}
