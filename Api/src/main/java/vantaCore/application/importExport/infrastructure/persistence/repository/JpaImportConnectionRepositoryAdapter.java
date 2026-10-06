package vantaCore.application.importExport.infrastructure.persistence.repository;

import org.springframework.stereotype.Repository;
import vantaCore.application.importExport.domain.ImportConnectionAggregate;
import vantaCore.application.importExport.domain.ImportConnectionSnapshot;
import vantaCore.application.importExport.domain.repository.ImportConnectionRepositoryInterface;
import vantaCore.application.importExport.domain.vo.ImportConnectionId;
import vantaCore.application.importExport.infrastructure.persistence.entity.ImportConnectionEntity;
import vantaCore.application.shared.infrastructure.security.CredentialEncryptor;

import java.util.Optional;

@Repository
public class JpaImportConnectionRepositoryAdapter implements ImportConnectionRepositoryInterface {

    private final SpringDataImportConnectionRepositoryInterface repository;
    private final CredentialEncryptor credentialEncryptor;

    public JpaImportConnectionRepositoryAdapter(
        SpringDataImportConnectionRepositoryInterface repository,
        CredentialEncryptor credentialEncryptor
    ) {
        this.repository = repository;
        this.credentialEncryptor = credentialEncryptor;
    }

    @Override
    public void save(ImportConnectionAggregate connection) {
        String encryptedToken = this.credentialEncryptor.encrypt(connection.getToken());
        this.repository.save(ImportConnectionEntity.fromDomain(connection, encryptedToken));
    }

    @Override
    public Optional<ImportConnectionSnapshot> findById(ImportConnectionId id) {
        return this.repository.findById(id.value())
            .map(entity -> entity.toDomain(this.credentialEncryptor.decrypt(entity.getEncryptedToken())));
    }
}
