package vantaCore.application.testCase.domain.repository;

import vantaCore.application.testCase.domain.TestCaseAggregate;
import vantaCore.application.testCase.domain.vo.TestCaseId;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TestCaseAggregateRepositoryInterface {

    void save(TestCaseAggregate testCase);

    Optional<TestCaseAggregate> findById(TestCaseId id);

    /** oldest first */
    List<TestCaseAggregate> findAllByTicketId(UUID ticketId);

    void deleteById(TestCaseId id);
}
