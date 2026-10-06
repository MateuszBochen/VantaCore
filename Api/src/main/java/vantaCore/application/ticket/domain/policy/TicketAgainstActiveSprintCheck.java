package vantaCore.application.ticket.domain.policy;

import vantaCore.application.board.domain.BoardSnapshot;
import vantaCore.application.ticket.domain.TicketSnapshot;

public record TicketAgainstActiveSprintCheck(
    TicketSnapshot previous,
    TicketSnapshot updated,
    BoardSnapshot board
) {
}
