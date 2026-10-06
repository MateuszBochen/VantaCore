package vantaCore.application.user.infrastructure.persistence.repository;

import org.springframework.stereotype.Repository;
import vantaCore.application.role.domain.vo.RoleId;
import vantaCore.application.shared.application.exception.UserNotFoundException;
import vantaCore.application.user.domain.UserAggregate;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface;
import vantaCore.application.user.domain.vo.Email;
import vantaCore.application.user.domain.vo.UserId;
import vantaCore.application.user.infrastructure.persistence.entity.UserEntity;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class JpaUserRepositoryAdapter implements UserAggregateRepositoryInterface {

    private final SpringDataUserRepositoryInterface repository;

    public JpaUserRepositoryAdapter(
            SpringDataUserRepositoryInterface repository
    ) {
        this.repository = repository;
    }

    @Override
    public void save(UserAggregate userAggregate) {
        UserEntity entity = UserEntity.fromDomain(userAggregate);
        this.repository.save(entity);
    }

    @Override
    public UserAggregate findById(UserId id) {
        Optional<UserEntity> userEntity = this.repository.findById(id.value());
        if (userEntity.isEmpty()) {
            throw new UserNotFoundException();
        }

        return userEntity.get().toDomain();
    }

    @Override
    public Optional<UserAggregate> findByEmail(Email email) {
        Optional<UserEntity> userEntity = this.repository.findByEmail(email.value());
        return userEntity.map(UserEntity::toDomain);
    }

    @Override
    public Optional<UserAggregate> findByEmailIgnoreCase(Email email) {
        List<UserEntity> matches = this.repository.findAllByEmailIgnoreCase(email.value());
        if (matches.size() == 1) {
            return Optional.of(matches.get(0).toDomain());
        }

        return this.repository.findByEmail(email.value()).map(UserEntity::toDomain);
    }

    @Override
    public boolean existsByRoleId(RoleId roleId) {
        return this.repository.existsByRoleIdsContains(roleId.value());
    }

    @Override
    public Set<UUID> findExistingIds(Set<UUID> ids) {
        if (ids.isEmpty()) {
            return Set.of();
        }

        return this.repository.findAllById(ids).stream()
            .map(UserEntity::getId)
            .collect(Collectors.toSet());
    }

    @Override
    public List<UserSummary> findAllSummaries() {
        return this.repository.findAllByOrderByFirstNameAscLastNameAsc().stream()
            .map(projection -> new UserSummary(
                new UserId(projection.getId()),
                projection.getFirstName(),
                projection.getLastName(),
                projection.getEmail(),
                projection.getAvatarUrl()
            ))
            .toList();
    }
}
