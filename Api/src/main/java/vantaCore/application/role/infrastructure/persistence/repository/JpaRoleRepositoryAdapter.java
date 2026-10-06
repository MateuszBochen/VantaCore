package vantaCore.application.role.infrastructure.persistence.repository;

import org.springframework.stereotype.Repository;
import vantaCore.application.role.domain.RoleAggregate;
import vantaCore.application.role.domain.repository.RoleAggregateRepositoryInterface;
import vantaCore.application.role.domain.vo.RoleId;
import vantaCore.application.role.infrastructure.persistence.entity.RoleEntity;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public class JpaRoleRepositoryAdapter implements RoleAggregateRepositoryInterface {

    private final SpringDataRoleRepositoryInterface repository;

    public JpaRoleRepositoryAdapter(SpringDataRoleRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public void save(RoleAggregate role) {
        this.repository.save(RoleEntity.fromDomain(role));
    }

    @Override
    public Optional<RoleAggregate> findById(RoleId id) {
        return this.repository.findById(id.value()).map(RoleEntity::toDomain);
    }

    @Override
    public List<RoleAggregate> findAllById(Set<RoleId> ids) {
        List<UUID> uuids = ids.stream().map(RoleId::value).toList();
        return this.repository.findAllById(uuids).stream().map(RoleEntity::toDomain).toList();
    }

    @Override
    public Optional<RoleAggregate> findByName(String name) {
        return this.repository.findByName(name).map(RoleEntity::toDomain);
    }

    @Override
    public boolean existsByName(String name) {
        return this.repository.existsByName(name);
    }

    @Override
    public RoleAggregate findSystemRole() {
        return this.repository.findByIsSystemTrue()
            .map(RoleEntity::toDomain)
            .orElseThrow(() -> new IllegalStateException("System role is missing - has the V21 migration run?"));
    }

    @Override
    public List<RoleAggregate> findAll() {
        return this.repository.findAll().stream().map(RoleEntity::toDomain).toList();
    }

    @Override
    public void deleteById(RoleId id) {
        this.repository.deleteById(id.value());
    }
}
