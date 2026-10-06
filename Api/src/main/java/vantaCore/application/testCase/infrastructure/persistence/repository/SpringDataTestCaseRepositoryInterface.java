package vantaCore.application.testCase.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vantaCore.application.testCase.infrastructure.persistence.entity.TestCaseEntity;

import java.util.List;
import java.util.UUID;

public interface SpringDataTestCaseRepositoryInterface extends JpaRepository<TestCaseEntity, UUID> {

    List<TestCaseEntity> findAllByTicketIdOrderByCreatedAtAsc(UUID ticketId);
}
