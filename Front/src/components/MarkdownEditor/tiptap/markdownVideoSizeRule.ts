import type MarkdownIt from 'markdown-it';
import type StateInline from 'markdown-it/lib/rules_inline/state_inline';

// There's no standard markdown syntax for video (unlike images) and no
// built-in Tiptap video extension to extend - this is a from-scratch inline
// rule for a bespoke `!video[title](src =WxH)` syntax, deliberately a
// smaller subset of markdownImageSizeRule.ts's own logic: only the inline
// `(href "title" =WxH)` form, no `![label][ref]` reference-link form, since
// a video node is only ever produced by the toolbar/picker (AttachmentVideo's
// insertVideo command or its markdown serializer below), never hand-typed as
// a markdown reference link.
//
// Crucially, tiptap-markdown doesn't map markdown-it token TYPES to
// ProseMirror nodes directly - `MarkdownParser.parse` (see
// node_modules/tiptap-markdown/src/parse/MarkdownParser.js) renders markdown
// all the way to an HTML STRING via `md.render()`, then lets ProseMirror's
// own schema-driven DOM parsing (each node's parseHTML) turn that HTML into
// nodes - exactly like pasting HTML in. AttachmentImage's rule can lean on
// markdown-it's own built-in `image` token renderer (it just REPLACES that
// rule but keeps pushing a token of type 'image', so the existing
// `<img>`-producing renderer still applies). There's no built-in renderer
// for a type markdown-it has never heard of, so this file also registers
// its own `md.renderer.rules['attachment_video']` that builds the literal
// `<video>` tag - AttachmentVideo's `parseHTML: [{tag: 'video[src]'}]` is
// what turns THAT into the actual ProseMirror node.
const parseSize = (src: string, pos: number, max: number): {ok: boolean; pos: number; width: string; height: string} => {
  const parseNumber = (start: number) => {
    let p = start;
    let code = src.charCodeAt(p);

    while (p < max && ((code >= 0x30 /* 0 */ && code <= 0x39) /* 9 */ || code === 0x25) /* % */) {
      code = src.charCodeAt(++p);
    }

    return {pos: p, value: src.slice(start, p)};
  };

  const fail = {ok: false, pos, width: '', height: ''};

  if (pos >= max || src.charCodeAt(pos) !== 0x3d /* = */) {
    return fail;
  }

  let cursor = pos + 1;
  const firstCode = src.charCodeAt(cursor);

  if (firstCode !== 0x78 /* x */ && (firstCode < 0x30 || firstCode > 0x39)) {
    return fail;
  }

  const width = parseNumber(cursor);
  cursor = width.pos;

  if (src.charCodeAt(cursor) !== 0x78 /* x */) {
    return fail;
  }

  cursor++;

  const height = parseNumber(cursor);
  cursor = height.pos;

  return {ok: true, pos: cursor, width: width.value, height: height.value};
};

const MARKER = '!video[';

const videoWithSize = (md: MarkdownIt) => (state: StateInline, silent: boolean): boolean => {
  const max = state.posMax;
  const oldPos = state.pos;

  if (state.src.slice(state.pos, state.pos + MARKER.length) !== MARKER) {
    return false;
  }

  const labelStart = state.pos + MARKER.length;
  const labelEnd = md.helpers.parseLinkLabel(state, state.pos + MARKER.length - 1, false);

  if (labelEnd < 0) {
    return false;
  }

  let pos = labelEnd + 1;

  if (pos >= max || state.src.charCodeAt(pos) !== 0x28 /* ( */) {
    return false;
  }

  pos++;

  for (; pos < max; pos++) {
    const code = state.src.charCodeAt(pos);
    if (code !== 0x20 && code !== 0x0a) break;
  }

  if (pos >= max) {
    return false;
  }

  let href = '';
  let title = '';
  let width = '';
  let height = '';

  const destRes = md.helpers.parseLinkDestination(state.src, pos, state.posMax);

  if (destRes.ok) {
    href = md.normalizeLink(destRes.str);

    if (md.validateLink(href)) {
      pos = destRes.pos;
    } else {
      href = '';
    }
  }

  const beforeTitle = pos;

  for (; pos < max; pos++) {
    const code = state.src.charCodeAt(pos);
    if (code !== 0x20 && code !== 0x0a) break;
  }

  const titleRes = md.helpers.parseLinkTitle(state.src, pos, state.posMax);

  if (pos < max && beforeTitle !== pos && titleRes.ok) {
    title = titleRes.str;
    pos = titleRes.pos;

    for (; pos < max; pos++) {
      const code = state.src.charCodeAt(pos);
      if (code !== 0x20 && code !== 0x0a) break;
    }
  }

  if (pos - 1 >= 0 && state.src.charCodeAt(pos - 1) === 0x20) {
    const sizeRes = parseSize(state.src, pos, state.posMax);

    if (sizeRes.ok) {
      width = sizeRes.width;
      height = sizeRes.height;
      pos = sizeRes.pos;

      for (; pos < max; pos++) {
        const code = state.src.charCodeAt(pos);
        if (code !== 0x20 && code !== 0x0a) break;
      }
    }
  }

  if (pos >= max || state.src.charCodeAt(pos) !== 0x29 /* ) */) {
    state.pos = oldPos;
    return false;
  }

  pos++;

  if (!silent) {
    const token = state.push('attachment_video', 'video', 0);
    const label = state.src.slice(labelStart, labelEnd);
    const attrs: Array<[string, string]> = [['src', href]];

    if (title || label) {
      attrs.push(['title', title || label]);
    }

    if (width !== '') {
      attrs.push(['width', width]);
    }

    if (height !== '') {
      attrs.push(['height', height]);
    }

    token.attrs = attrs;
  }

  state.pos = pos;
  state.posMax = max;
  return true;
};

const markdownVideoSizeRule = (md: MarkdownIt): void => {
  md.inline.ruler.before('emphasis', 'attachment_video', videoWithSize(md));

  md.renderer.rules.attachment_video = (tokens, idx) => {
    const token = tokens[idx];
    const attrStr = (token.attrs ?? []).map(([name, value]) => `${name}="${md.utils.escapeHtml(value)}"`).join(' ');
    return `<video ${attrStr}></video>`;
  };
};

export default markdownVideoSizeRule;
