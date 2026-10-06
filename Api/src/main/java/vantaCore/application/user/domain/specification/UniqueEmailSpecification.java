package vantaCore.application.user.domain.specification;

import org.springframework.stereotype.Component;
import vantaCore.application.shared.domain.specification.SpecificationInterface;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface;
import vantaCore.application.user.domain.vo.Email;

@Component
final public class UniqueEmailSpecification implements SpecificationInterface<Email> {

    private final UserAggregateRepositoryInterface userAggregateRepository;

    UniqueEmailSpecification(UserAggregateRepositoryInterface userAggregateRepository) {
        this.userAggregateRepository = userAggregateRepository;
    }

    @Override
    public boolean isSatisfied(Email email) {
        return this.userAggregateRepository.findByEmail(email).isEmpty();
    }
}
