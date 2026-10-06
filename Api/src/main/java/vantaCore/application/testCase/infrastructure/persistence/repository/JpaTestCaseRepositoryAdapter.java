package vantaCore.application.testCase.infrastructure.persistence.repository;

import org.springframework.stereotype.Repository;
import vantaCore.application.testCase.domain.TestCaseAggregate;
import vantaCore.application.testCase.domain.repository.TestCaseAggregateRepositoryInterface;
import vantaCore.application.testCase.domain.vo.TestCaseId;
import vantaCore.application.testCase.infrastructure.persistence.entity.TestCaseEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class JpaTestCaseRepositoryAdapter implements TestCaseAggregateRepositoryInterface {

    private final SpringDataTestCaseRepositoryInterface repository;

    public JpaTestCaseRepositoryAdapter(SpringDataTestCaseRepositoryInterface repository) {
        this.repository = repository;
    }

    @Override
    public void save(TestCaseAggregate testCase) {
        this.repository.save(TestCaseEntity.fromDomain(testCase));
    }

    @Override
    public Optional<TestCaseAggregate> findById(TestCaseId id) {
        return this.repository.findById(id.value()).map(TestCaseEntity::toDomain);
    }

    @Override
    public List<TestCaseAggregate> findAllByTicketId(UUID ticketId) {
        return this.repository.findAllByTicketIdOrderByCreatedAtAsc(ticketId).stream()
            .map(TestCaseEntity::toDomain)
            .toList();
    }

    @Override
    public void deleteById(TestCaseId id) {
        this.repository.deleteById(id.value());
    }
}
