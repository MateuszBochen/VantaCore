package vantaCore.application.board.infrastructure.persistence.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import vantaCore.application.board.domain.BoardAggregate;
import vantaCore.application.board.domain.vo.BoardId;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Entity
@Table(name = "boards")
public class BoardEntity {

    @Id
    private UUID id;

    private String name;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "board_projects",
        joinColumns = @JoinColumn(name = "board_id")
    )
    @Column(name = "project_id")
    private Set<UUID> projectIds = new HashSet<>();

    // Display order left-to-right on the Kanban board, so @OrderColumn (not a Set) to preserve it.
    // Hibernate persists an indexed bidirectional one-to-many in two steps - INSERT the child row via
    // ColumnEntity's own @ManyToOne (board_id set correctly there), then a follow-up UPDATE to fill in
    // column_order once the collection's positions are known - hence column_order must be nullable at
    // the DB level (see V18__make_board_column_order_nullable.sql) even though it's always populated
    // by the time the transaction commits.
    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderColumn(name = "column_order")
    private List<ColumnEntity> columns = new ArrayList<>();

    private boolean allowEditTicketInActiveSprint;
    private boolean allowChangeEstimateInActiveSprint;
    private boolean allowAddTicketToActiveSprint;
    private boolean allowRemoveTicketFromActiveSprint;

    // Hibernate requires it
    protected BoardEntity() {}

    private BoardEntity(
        UUID id,
        String name,
        Set<UUID> projectIds,
        boolean allowEditTicketInActiveSprint,
        boolean allowChangeEstimateInActiveSprint,
        boolean allowAddTicketToActiveSprint,
        boolean allowRemoveTicketFromActiveSprint
    ) {
        this.id = id;
        this.name = name;
        this.projectIds = projectIds;
        this.allowEditTicketInActiveSprint = allowEditTicketInActiveSprint;
        this.allowChangeEstimateInActiveSprint = allowChangeEstimateInActiveSprint;
        this.allowAddTicketToActiveSprint = allowAddTicketToActiveSprint;
        this.allowRemoveTicketFromActiveSprint = allowRemoveTicketFromActiveSprint;
    }

    public static BoardEntity fromDomain(BoardAggregate board) {
        var snapshot = board.toSnapshot();

        BoardEntity entity = new BoardEntity(
            snapshot.id().value(),
            snapshot.name(),
            new HashSet<>(snapshot.projectIds()),
            snapshot.allowEditTicketInActiveSprint(),
            snapshot.allowChangeEstimateInActiveSprint(),
            snapshot.allowAddTicketToActiveSprint(),
            snapshot.allowRemoveTicketFromActiveSprint()
        );

        for (var column : snapshot.columns()) {
            entity.columns.add(ColumnEntity.fromDomain(column, entity));
        }

        return entity;
    }

    public BoardAggregate toDomain() {
        return BoardAggregate.newBoard(
            new BoardId(this.id),
            this.name,
            this.projectIds,
            this.columns.stream().map(ColumnEntity::toDomain).collect(Collectors.toList()),
            this.allowEditTicketInActiveSprint,
            this.allowChangeEstimateInActiveSprint,
            this.allowAddTicketToActiveSprint,
            this.allowRemoveTicketFromActiveSprint
        );
    }
}
