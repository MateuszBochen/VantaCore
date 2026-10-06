package vantaCore.application.accessToken.infrastructure.persistence.repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import vantaCore.application.accessToken.domain.PersonalAccessTokenAggregate;
import vantaCore.application.accessToken.domain.repository.PersonalAccessTokenRepositoryInterface;
import vantaCore.application.accessToken.domain.vo.AccessTokenId;
import vantaCore.application.accessToken.infrastructure.persistence.entity.PersonalAccessTokenEntity;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JpaPersonalAccessTokenRepositoryAdapter implements PersonalAccessTokenRepositoryInterface {

    private final SpringDataPersonalAccessTokenRepositoryInterface repository;

    @PersistenceContext
    private EntityManager entityManager;

    public JpaPersonalAccessTokenRepositoryAdapter(SpringDataPersonalAccessTokenRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public void save(PersonalAccessTokenAggregate token) {
        this.repository.save(PersonalAccessTokenEntity.fromDomain(token));
    }

    @Override
    public Optional<PersonalAccessTokenAggregate> findById(AccessTokenId id) {
        return this.repository.findById(id.value()).map(PersonalAccessTokenEntity::toDomain);
    }

    @Override
    public Optional<PersonalAccessTokenAggregate> findByTokenHash(String tokenHash) {
        return this.repository.findByTokenHash(tokenHash).map(PersonalAccessTokenEntity::toDomain);
    }

    @Override
    public List<PersonalAccessTokenAggregate> findAllByUserId(UUID userId) {
        return this.repository.findAllByUserId(userId).stream().map(PersonalAccessTokenEntity::toDomain).toList();
    }

    @Override
    public long countByUserId(UUID userId) {
        return this.repository.countByUserId(userId);
    }

    @Override
    @Transactional
    public void recordUse(AccessTokenId id, Instant usedAt) {
        this.entityManager.createNativeQuery("UPDATE personal_access_tokens SET last_used_at = ?1 WHERE id = ?2")
            .setParameter(1, usedAt)
            .setParameter(2, id.value())
            .executeUpdate();
    }

    @Override
    public void deleteById(AccessTokenId id) {
        this.repository.deleteById(id.value());
    }
}
