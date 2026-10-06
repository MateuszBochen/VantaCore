package vantaCore.application.role.domain.repository;

import vantaCore.application.role.domain.RoleAggregate;
import vantaCore.application.role.domain.vo.RoleId;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface RoleAggregateRepositoryInterface {

    /** saving aggregate (create or full replace) */
    void save(RoleAggregate role);

    Optional<RoleAggregate> findById(RoleId id);

    List<RoleAggregate> findAllById(Set<RoleId> ids);

    Optional<RoleAggregate> findByName(String name);

    boolean existsByName(String name);

    /** the single seeded isSystem=true role - must always exist once V21 has run */
    RoleAggregate findSystemRole();

    List<RoleAggregate> findAll();

    void deleteById(RoleId id);
}
