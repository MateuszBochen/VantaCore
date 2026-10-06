import type MarkdownIt from 'markdown-it';

// Both the @mention and ~ticket-link nodes serialize to a plain markdown
// link with a custom URL scheme (mention:USER_ID / ticket:TICKET_ID)
// instead of inventing a whole new inline syntax - markdown-it already
// tokenizes `[text](url)` correctly on its own, so parsing back only needs
// to recognize that one scheme and swap the resulting three tokens
// (link_open/text/link_close) for a single custom token. The renderer for
// that token then emits `<span data-type="...">`, which is exactly what
// Tiptap's own parseHTML for these nodes already expects (see
// @tiptap/extension-mention's `span[data-type="<name>"]`), so no custom
// ProseMirror-level parsing is needed either - Tiptap's normal HTML
// parsing takes it from there.
//
// Guarded against re-registering: MarkdownParser.parse() re-runs every
// registered extension's parse.setup() on every setContent() call, but
// re-uses the same markdown-it instance for the editor's lifetime -
// without this guard, every call would push another (redundant, if
// harmless) copy of the same rule.
export const registerLinkSchemeParseRule = (md: MarkdownIt, scheme: string, tokenType: string, dataType: string): void => {
  const registeredSchemes = ((md as unknown as {__registeredLinkSchemes?: Set<string>}).__registeredLinkSchemes ??= new Set());

  if (registeredSchemes.has(scheme)) {
    return;
  }

  registeredSchemes.add(scheme);

  md.core.ruler.push(`${tokenType}-link`, (state) => {
    state.tokens.forEach((blockToken) => {
      if (blockToken.type !== 'inline' || !blockToken.children) {
        return;
      }

      const children = blockToken.children;
      const nextChildren: typeof children = [];

      for (let i = 0; i < children.length; i++) {
        const token = children[i];

        if (token.type === 'link_open') {
          const href = token.attrGet('href') ?? '';

          if (href.startsWith(`${scheme}:`)) {
            const label = children[i + 1]?.content ?? '';
            const id = href.slice(scheme.length + 1);

            const customToken = new state.Token(tokenType, '', 0);
            customToken.meta = {id, label};
            nextChildren.push(customToken);
            i += 2; // skip the text token and matching link_close
            continue;
          }
        }

        nextChildren.push(token);
      }

      blockToken.children = nextChildren;
    });
  });

  md.renderer.rules[tokenType] = (tokens, idx) => {
    const {id, label} = tokens[idx].meta as {id: string; label: string};
    return `<span data-type="${dataType}" data-id="${id}" data-label="${label}">${label}</span>`;
  };
};
