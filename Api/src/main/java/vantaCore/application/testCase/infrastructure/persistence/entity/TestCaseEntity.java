package vantaCore.application.testCase.infrastructure.persistence.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import vantaCore.application.testCase.domain.TestCaseAggregate;
import vantaCore.application.testCase.domain.vo.TestCaseId;
import vantaCore.application.testCase.domain.vo.TestCaseStatus;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "test_cases")
public class TestCaseEntity {

    @Id
    private UUID id;

    private UUID ticketId;
    private UUID authorId;
    private String title;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "test_case_steps", joinColumns = @JoinColumn(name = "test_case_id"))
    @OrderColumn(name = "step_order")
    @Column(name = "step")
    private List<String> steps = new ArrayList<>();

    @Column(columnDefinition = "text")
    private String expectedResult;

    @Enumerated(EnumType.STRING)
    private TestCaseStatus status;

    private Instant createdAt;

    // Hibernate requires it
    protected TestCaseEntity() {}

    private TestCaseEntity(
        UUID id,
        UUID ticketId,
        UUID authorId,
        String title,
        List<String> steps,
        String expectedResult,
        TestCaseStatus status,
        Instant createdAt
    ) {
        this.id = id;
        this.ticketId = ticketId;
        this.authorId = authorId;
        this.title = title;
        this.steps = steps;
        this.expectedResult = expectedResult;
        this.status = status;
        this.createdAt = createdAt;
    }

    public static TestCaseEntity fromDomain(TestCaseAggregate testCase) {
        var snapshot = testCase.toSnapshot();

        return new TestCaseEntity(
            snapshot.id().value(),
            snapshot.ticketId(),
            snapshot.authorId(),
            snapshot.title(),
            new ArrayList<>(snapshot.steps()),
            snapshot.expectedResult(),
            snapshot.status(),
            snapshot.createdAt()
        );
    }

    public TestCaseAggregate toDomain() {
        return TestCaseAggregate.newTestCase(
            new TestCaseId(this.id),
            this.ticketId,
            this.authorId,
            this.title,
            this.steps,
            this.expectedResult,
            this.status,
            this.createdAt
        );
    }
}
