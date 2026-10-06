package vantaCore.application.importExport.domain.repository;

import vantaCore.application.importExport.domain.ImportConnectionAggregate;
import vantaCore.application.importExport.domain.ImportConnectionSnapshot;
import vantaCore.application.importExport.domain.vo.ImportConnectionId;

import java.util.Optional;

public interface ImportConnectionRepositoryInterface {

    /** encrypts the token on the way in - see CredentialEncryptor */
    void save(ImportConnectionAggregate connection);

    /** decrypts the token on the way out - see CredentialEncryptor */
    Optional<ImportConnectionSnapshot> findById(ImportConnectionId id);
}
