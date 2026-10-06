package vantaCore.application.vcs.domain.repository;

import vantaCore.application.vcs.domain.VcsConnectionAggregate;
import vantaCore.application.vcs.domain.VcsConnectionSnapshot;
import vantaCore.application.vcs.domain.vo.VcsConnectionId;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VcsConnectionRepositoryInterface {

    /** encrypts webhookSecret on the way in - see CredentialEncryptor */
    void save(VcsConnectionAggregate connection);

    /** decrypts webhookSecret on the way out - only ever called server-side (webhook signature
     verification, or the create-response that shows it to the user once) */
    Optional<VcsConnectionSnapshot> findById(VcsConnectionId id);

    List<VcsConnectionSnapshot> findAllByProjectId(UUID projectId);

    void deleteById(VcsConnectionId id);
}
