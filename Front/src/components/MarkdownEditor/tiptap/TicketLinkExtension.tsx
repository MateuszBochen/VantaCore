import Mention from '@tiptap/extension-mention';
import {searchTicketsStub} from '@/lib/Ticket/searchTicketsStub';
import {createSuggestion} from './createSuggestion';
import {registerLinkSchemeParseRule} from './markdownLinkScheme';

// ~VC-1000 ticket links. `#` was already taken by markdown headings, hence
// `~` as the trigger char (per the agreed plan). Built the same way as
// UserMention - a second, independently-named Mention instance so both can
// be registered on the same editor without colliding, backed by
// searchTicketsStub until a real ticket-search endpoint exists.
export const TicketLink = Mention.extend({
  name: 'ticketLink',
  addStorage() {
    return {
      markdown: {
        serialize(state: {write: (text: string) => void}, node: {attrs: {id: string; label: string}}) {
          state.write(`[~${node.attrs.label}](ticket:${node.attrs.id})`);
        },
        parse: {
          setup(md: Parameters<typeof registerLinkSchemeParseRule>[0]) {
            registerLinkSchemeParseRule(md, 'ticket', 'ticketLink', 'ticketLink');
          },
        },
      },
    };
  },
}).configure({
  HTMLAttributes: {class: 'tiptap-ticket-link'},
  suggestion: createSuggestion({
    char: '~',
    items: searchTicketsStub,
    emptyLabel: 'No matching tickets',
    toSuggestionItem: (ticket) => ({
      id: ticket.id,
      label: ticket.key,
      render: (
        <>
          <span className="shrink-0 font-mono text-xs text-accent">{ticket.key}</span>
          <span className="min-w-0 flex-1 truncate">{ticket.title}</span>
        </>
      ),
    }),
  }),
});
