package vantaCore.application.sprint.appliaction.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

// Batch-shaped (rather than one ticketId/action pair) so a single PATCH can also cover a
// multi-select drag/checkbox action later - not just the single-ticket case this was first built
// for.
//
// Explicit @JsonCreator/@JsonProperty because this is a single-argument request DTO - see
// StartWorklogRequest for why Jackson's implicit constructor detection needs disambiguating for
// exactly one constructor parameter.
final public class UpdateSprintTicketRequest {

    @Valid
    @NotEmpty
    private final List<SprintTicketActionRequest> tickets;

    @JsonCreator
    public UpdateSprintTicketRequest(@JsonProperty("tickets") List<SprintTicketActionRequest> tickets) {
        this.tickets = tickets;
    }

    public List<SprintTicketActionRequest> getTickets() {
        return tickets;
    }
}
