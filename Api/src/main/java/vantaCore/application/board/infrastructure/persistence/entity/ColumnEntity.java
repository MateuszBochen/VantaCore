package vantaCore.application.board.infrastructure.persistence.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import vantaCore.application.board.domain.vo.Column;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "board_columns")
public class ColumnEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id")
    private BoardEntity board;

    private String name;
    private String color;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "board_column_statuses",
        joinColumns = @JoinColumn(name = "column_id")
    )
    @jakarta.persistence.Column(name = "status_id")
    private Set<UUID> statusIds = new HashSet<>();

    // Hibernate requires it
    protected ColumnEntity() {}

    private ColumnEntity(UUID id, BoardEntity board, String name, String color, Set<UUID> statusIds) {
        this.id = id;
        this.board = board;
        this.name = name;
        this.color = color;
        this.statusIds = statusIds;
    }

    public static ColumnEntity fromDomain(Column column, BoardEntity board) {
        return new ColumnEntity(
            column.id(),
            board,
            column.name(),
            column.color(),
            new HashSet<>(column.statusIds())
        );
    }

    public Column toDomain() {
        return new Column(
            this.id,
            this.name,
            this.color,
            this.statusIds
        );
    }
}
