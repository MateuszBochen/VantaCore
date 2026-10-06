import Mention from '@tiptap/extension-mention';
import {Avatar} from '@/components/ui/avatar';
import {usersCache} from '@/lib/User/UsersCache';
import getUserDisplayName from '@/lib/User/getUserDisplayName';
import type {UserSummary} from '@/lib/User/Type/types';
import {createSuggestion} from './createSuggestion';
import {registerLinkSchemeParseRule} from './markdownLinkScheme';

// @user mentions. Searches usersCache directly (not useUsersHook) since the
// suggestion's items() runs outside React, called by a ProseMirror plugin -
// UsersCache is the same plain synchronous store useUsersHook itself reads
// from, so this doesn't duplicate the user directory or its fetch, it's just
// read without the hook wrapper.
const searchUsers = (query: string): UserSummary[] => {
  const users = usersCache.get() ?? [];
  const q = query.trim().toLowerCase();

  if (!q) {
    return users.slice(0, 8);
  }

  return users
    .filter((user) => getUserDisplayName(user).toLowerCase().includes(q) || user.email.toLowerCase().includes(q))
    .slice(0, 8);
};

// Serializes to a plain markdown link with a `mention:` scheme
// (`[@Name](mention:USER_ID)`) rather than inventing new syntax - see
// markdownLinkScheme.ts for why, and how it's parsed back.
export const UserMention = Mention.extend({
  name: 'mention',
  addStorage() {
    return {
      markdown: {
        serialize(state: {write: (text: string) => void}, node: {attrs: {id: string; label: string}}) {
          state.write(`[@${node.attrs.label}](mention:${node.attrs.id})`);
        },
        parse: {
          setup(md: Parameters<typeof registerLinkSchemeParseRule>[0]) {
            registerLinkSchemeParseRule(md, 'mention', 'mention', 'mention');
          },
        },
      },
    };
  },
}).configure({
  HTMLAttributes: {class: 'tiptap-mention'},
  suggestion: createSuggestion({
    char: '@',
    items: searchUsers,
    emptyLabel: 'No matching users',
    toSuggestionItem: (user) => ({
      id: user.id,
      label: getUserDisplayName(user),
      render: (
        <>
          <Avatar name={getUserDisplayName(user)} src={user.avatarUrl} />
          {getUserDisplayName(user)}
        </>
      ),
    }),
  }),
});
