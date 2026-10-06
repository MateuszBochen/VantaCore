export type TicketSearchResult = {
  id: string;
  key: string;
  title: string;
};

// No dedicated ticket-search endpoint exists yet - console.log stands in
// for it so the ~ticket-link suggestion dropdown can be wired up and
// exercised now (the dropdown itself, positioning, keyboard nav, insertion,
// markdown round-trip - all real); it just never has anything to show,
// since there's no real data source to search yet. Swap the body for a real
// request() call once the endpoint exists - MarkdownEditor/TicketLinkList
// don't need to change.
export const searchTicketsStub = async (query: string): Promise<TicketSearchResult[]> => {
  console.log(`[ticket-link] search stub for "${query}" - no search endpoint yet, always returns []`);

  return [];
};
