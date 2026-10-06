package vantaCore.application.search.appliaction.query.search;

import vantaCore.application.shared.application.query.Collection;

// Each section is its own paginated Collection (same page/limit for all four, but its own total),
// so the frontend can show "N results" per type without paging to the end. A type that wasn't
// requested (see SearchQuery.includes) comes back as an empty Collection with total 0.
//
// tickets is Collection<Object> rather than Collection<SearchTicketResult> because its element type
// varies at request time: SearchTicketResult (id/projectId/key/title) normally, or the full
// vantaCore.application.ticket.appliaction.query.getTicket.GetTicketResult when fullMode=true -
// see SearchQueryHandler. Jackson serializes each element by its runtime type either way.
public record SearchResult(
    Collection<SearchProjectResult> projects,
    Collection<SearchSubProjectResult> subProjects,
    Collection<Object> tickets,
    Collection<SearchTestCaseResult> testCases
) {
}
