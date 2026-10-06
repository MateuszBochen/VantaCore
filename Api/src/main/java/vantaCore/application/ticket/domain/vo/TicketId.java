package vantaCore.application.ticket.domain.vo;

import java.util.UUID;

public record TicketId(UUID value) {

    public TicketId {
        if (value == null) {
            throw new IllegalArgumentException("TicketId cannot be null");
        }
    }

    @Override
    public String toString() {
        return this.value.toString();
    }
}
