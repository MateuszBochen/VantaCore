package vantaCore.application.role.domain.specification;

import org.springframework.stereotype.Component;
import vantaCore.application.role.domain.repository.RoleAggregateRepositoryInterface;
import vantaCore.application.shared.domain.specification.SpecificationInterface;

@Component
final public class UniqueRoleNameSpecification implements SpecificationInterface<String> {

    private final RoleAggregateRepositoryInterface roleAggregateRepository;

    UniqueRoleNameSpecification(RoleAggregateRepositoryInterface roleAggregateRepository) {
        this.roleAggregateRepository = roleAggregateRepository;
    }

    @Override
    public boolean isSatisfied(String name) {
        return this.roleAggregateRepository.findByName(name).isEmpty();
    }
}
