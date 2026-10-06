package vantaCore.application.board.domain.vo;

import java.util.UUID;

public record BoardId(UUID value) {

    public BoardId {
        if (value == null) {
            throw new IllegalArgumentException("BoardId cannot be null");
        }
    }

    @Override
    public String toString() {
        return this.value.toString();
    }
}
