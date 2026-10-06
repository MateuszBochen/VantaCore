package vantaCore.application.sprint.appliaction.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

final public class UpsertSprintRequest {

    @NotBlank
    @Size(max = 255)
    private final String name;

    @NotNull
    private final LocalDate startDate;

    @NotNull
    private final LocalDate endDate;

    @Valid
    private final List<SprintTicketRequest> tickets;

    public UpsertSprintRequest(String name, LocalDate startDate, LocalDate endDate, List<SprintTicketRequest> tickets) {
        this.name = name;
        this.startDate = startDate;
        this.endDate = endDate;
        this.tickets = tickets;
    }

    public String getName() {
        return name;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public List<SprintTicketRequest> getTickets() {
        return tickets;
    }
}
