import type MarkdownIt from 'markdown-it';
import type StateInline from 'markdown-it/lib/rules_inline/state_inline';

// A trimmed, browser-safe port of markdown-it-imsize's inline image rule
// (https://github.com/tatsy/markdown-it-imsize/blob/master/lib/index.js) -
// that package unconditionally requires a vendored, Node-only image-
// dimension sniffer (dynamic `require()` of format modules under
// lib/imsize/types/*, used only for its `autofill` option) which crashes
// immediately when bundled for the browser ("Calling `require`... doesn't
// expose the `require` function") even though AttachmentImage never uses
// autofill - it always supplies width/height explicitly (the resize
// handle). This keeps only the actual parsing logic - recognizing a
// trailing `=WxH` / `=Wx` / `=xH` on an image, otherwise identical to
// markdown-it's own built-in image rule (which this REPLACES, so both the
// inline-link and reference-link forms are still handled, not just the one
// AttachmentImage's own serializer happens to emit) - with zero
// dependencies of its own. Tokenizing the alt text reuses markdown-it's own
// public `md.inline.parse()` instead of the original's private/undocumented
// `new state.md.inline.State(...)` construction.

// Parses "=WxH" starting at `pos` - mirrors markdown-it-imsize's own
// parse_image_size.js exactly (width and/or height may be omitted, but the
// literal "x" separator is always required).
const parseImageSize = (src: string, pos: number, max: number): {ok: boolean; pos: number; width: string; height: string} => {
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

  // size must follow "=" without any whitespace, as one of:
  // (1) =300x200  (2) =300x  (3) =x200
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

const imageWithSize = (md: MarkdownIt) => (state: StateInline, silent: boolean): boolean => {
  const max = state.posMax;
  const oldPos = state.pos;

  if (state.src.charCodeAt(state.pos) !== 0x21 /* ! */ || state.src.charCodeAt(state.pos + 1) !== 0x5b /* [ */) {
    return false;
  }

  const labelStart = state.pos + 2;
  const labelEnd = md.helpers.parseLinkLabel(state, state.pos + 1, false);

  if (labelEnd < 0) {
    return false;
  }

  let pos = labelEnd + 1;
  let href = '';
  let title = '';
  let width = '';
  let height = '';

  if (pos < max && state.src.charCodeAt(pos) === 0x28 /* ( */) {
    // Inline form: ![label](href "title" =WxH)
    pos++;

    for (; pos < max; pos++) {
      const code = state.src.charCodeAt(pos);
      if (code !== 0x20 && code !== 0x0a) break;
    }

    if (pos >= max) {
      return false;
    }

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

    // there must be at least one whitespace between the previous field
    // (href or title) and the size
    if (pos - 1 >= 0 && state.src.charCodeAt(pos - 1) === 0x20) {
      const sizeRes = parseImageSize(state.src, pos, state.posMax);

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
  } else {
    // Reference form: ![label][ref] / ![label][] / ![label]
    if (typeof state.env.references === 'undefined') {
      return false;
    }

    let label = '';

    for (; pos < max; pos++) {
      const code = state.src.charCodeAt(pos);
      if (code !== 0x20 && code !== 0x0a) break;
    }

    if (pos < max && state.src.charCodeAt(pos) === 0x5b /* [ */) {
      const start = pos + 1;
      const found = md.helpers.parseLinkLabel(state, pos);

      if (found >= 0) {
        label = state.src.slice(start, found);
        pos = found + 1;
      } else {
        pos = labelEnd + 1;
      }
    } else {
      pos = labelEnd + 1;
    }

    if (!label) {
      label = state.src.slice(labelStart, labelEnd);
    }

    const ref = state.env.references[md.utils.normalizeReference(label)];

    if (!ref) {
      state.pos = oldPos;
      return false;
    }

    href = ref.href;
    title = ref.title;
  }

  if (!silent) {
    const tokens: MarkdownIt.Token[] = [];
    md.inline.parse(state.src.slice(labelStart, labelEnd), md, state.env, tokens);

    const token = state.push('image', 'img', 0);
    const attrs: Array<[string, string]> = [
      ['src', href],
      ['alt', ''],
    ];

    if (title) {
      attrs.push(['title', title]);
    }

    if (width !== '') {
      attrs.push(['width', width]);
    }

    if (height !== '') {
      attrs.push(['height', height]);
    }

    token.attrs = attrs;
    token.children = tokens;
  }

  state.pos = pos;
  state.posMax = max;
  return true;
};

const markdownImageSizeRule = (md: MarkdownIt): void => {
  md.inline.ruler.before('emphasis', 'image', imageWithSize(md));
};

export default markdownImageSizeRule;
