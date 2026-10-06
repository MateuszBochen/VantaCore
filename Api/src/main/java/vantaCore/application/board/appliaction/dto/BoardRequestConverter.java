package vantaCore.application.board.appliaction.dto;

import vantaCore.application.board.domain.vo.Column;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;

// Shared between CreateBoardCommandHandler and UpdateBoardCommandHandler - both build a
// BoardAggregate from the same CreateBoardRequest shape.
final public class BoardRequestConverter {

    private BoardRequestConverter() {}

    public static List<Column> toColumns(List<ColumnRequest> columnRequests) {
        if (columnRequests == null) {
            return Collections.emptyList();
        }

        return columnRequests.stream()
            .map(column -> new Column(
                column.getId(),
                column.getName(),
                column.getColor(),
                toUuidSet(column.getStatusIds())
            ))
            .toList();
    }

    public static Set<UUID> toUuidSet(List<UUID> list) {
        return list == null ? Set.of() : Set.copyOf(list);
    }
}
