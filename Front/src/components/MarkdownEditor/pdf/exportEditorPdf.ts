import {jsPDF} from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {CellDef, RowInput} from 'jspdf-autotable';
import type {JSONContent} from '@tiptap/react';
import {loadPdfImage, renderMermaidImage} from './loadPdfImage';
import type {PdfImage} from './loadPdfImage';
import {PDF_FONT, PDF_MONO_FONT, registerPdfFonts} from './registerPdfFonts';

// Client-side only, same as lib/Worklog/exportWorklogPdf - but instead of a
// fixed table layout, this walks the editor's own ProseMirror JSON
// (editor.getJSON()) and lays every block out by hand: real, selectable text
// in an embedded font (see registerPdfFonts for why jsPDF's built-in fonts
// can't be used), our own page breaking, tables through jspdf-autotable.
// Deliberately NOT jsPDF's doc.html(): that goes through html2canvas and is
// known for slicing lines across page breaks and drifting text positions.

// All layout in mm on A4. Font sizes are in pt (jsPDF's setFontSize unit).
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 16;
const CONTENT_BOTTOM = PAGE_HEIGHT - MARGIN;
const PT = 25.4 / 72;
const PX = 25.4 / 96;

const BODY_SIZE = 10.5;
const CODE_SIZE = 9;
const LINE_HEIGHT = 1.45;
const HEADING_SIZES: Record<number, number> = {1: 20, 2: 16, 3: 13.5, 4: 12, 5: 11, 6: 10.5};
const LIST_INDENT = 6;
const QUOTE_INDENT = 5;
const BULLETS = ['•', '–', '·'];

const COLORS = {
  text: '#111827',
  muted: '#4b5563',
  link: '#2563eb',
  accent: '#0f766e',
  codeBackground: '#f3f4f6',
  border: '#d1d5db',
};

type InlineStyle = {
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  strike?: boolean;
  underline?: boolean;
  href?: string;
  color?: string;
};

type Run = {text: string; style: InlineStyle} | {hardBreak: true};

type Piece = {text: string; style: InlineStyle; width: number};

// Where the current block is drawn: a horizontal band (narrowed by list /
// quote indentation) plus what nesting it's inside.
type Frame = {
  x: number;
  width: number;
  color?: string;
  listDepth: number;
  tight: boolean;
};

type Marker = {text: string; rightX: number};

class PdfWriter {
  readonly doc: jsPDF;

  y = MARGIN;

  // A list item's bullet/number, drawn on the baseline of whatever line the
  // item's first block ends up on - only known once that block is laid out
  // (it may itself get pushed to the next page).
  marker: Marker | null = null;

  constructor(doc: jsPDF) {
    this.doc = doc;
  }

  get page(): number {
    return this.doc.getCurrentPageInfo().pageNumber;
  }

  // Starts a new page when `height` doesn't fit in what's left of this one.
  // Never on a still-empty page - something taller than a whole page (a huge
  // code line, an image already scaled to page height) just gets drawn.
  ensureSpace(height: number): void {
    if (this.y + height > CONTENT_BOTTOM && this.y > MARGIN) {
      this.doc.addPage();
      this.y = MARGIN;
    }
  }

  // Spacing before a block, skipped at the top of a page so a page never
  // starts with a gap.
  space(height: number): void {
    if (this.y > MARGIN) {
      this.y += height;
    }
  }

  setFont(style: InlineStyle, size: number): void {
    if (style.code) {
      this.doc.setFont(PDF_MONO_FONT, 'normal');
      this.doc.setFontSize(size * 0.9);
      return;
    }

    this.doc.setFont(PDF_FONT, style.bold && style.italic ? 'bolditalic' : style.bold ? 'bold' : style.italic ? 'italic' : 'normal');
    this.doc.setFontSize(size);
  }

  measure(text: string, style: InlineStyle, size: number): number {
    this.setFont(style, size);
    return this.doc.getTextWidth(text);
  }

  drawMarker(baseline: number, size: number): void {
    if (!this.marker) {
      return;
    }

    this.setFont({}, size);
    this.doc.setTextColor(COLORS.text);
    this.doc.text(this.marker.text, this.marker.rightX, baseline, {align: 'right'});
    this.marker = null;
  }

  // A vertical rule (blockquote bar) from one position to another, split
  // into one segment per page when the block itself was split.
  verticalRule(x: number, fromPage: number, fromY: number, toPage: number, toY: number): void {
    this.doc.setDrawColor(COLORS.border);
    this.doc.setLineWidth(0.8);

    for (let page = fromPage; page <= toPage; page++) {
      this.doc.setPage(page);
      const top = page === fromPage ? fromY : MARGIN;
      const bottom = page === toPage ? toY : CONTENT_BOTTOM;

      if (bottom > top) {
        this.doc.line(x, top, x, bottom);
      }
    }

    this.doc.setPage(toPage);
  }
}

const applyMarks = (base: InlineStyle, marks: JSONContent['marks']): InlineStyle => {
  const style = {...base};

  (marks ?? []).forEach((mark) => {
    switch (mark.type) {
      case 'bold':
        style.bold = true;
        break;
      case 'italic':
        style.italic = true;
        break;
      case 'strike':
        style.strike = true;
        break;
      case 'underline':
        style.underline = true;
        break;
      case 'code':
        style.code = true;
        break;
      case 'link':
        style.href = mark.attrs?.href;
        style.color = COLORS.link;
        style.underline = true;
        break;
    }
  });

  return style;
};

// Mentions/ticket links print as their label (what the reader sees in the
// app), colored like a link - their `mention:`/`ticket:` hrefs mean nothing
// outside the app, so they aren't made clickable.
const collectRuns = (nodes: JSONContent[] | undefined, base: InlineStyle): Run[] =>
  (nodes ?? []).flatMap((node): Run[] => {
    switch (node.type) {
      case 'text':
        return [{text: node.text ?? '', style: applyMarks(base, node.marks)}];
      case 'hardBreak':
        return [{hardBreak: true}];
      case 'mention':
        return [{text: `@${node.attrs?.label ?? ''}`, style: {...base, bold: true, color: COLORS.accent}}];
      case 'ticketLink':
        return [{text: String(node.attrs?.label ?? ''), style: {...base, bold: true, color: COLORS.accent}}];
      default:
        return collectRuns(node.content, base);
    }
  });

// Greedy word wrap across differently-styled runs. Whitespace collapses to
// single spaces and is dropped at line starts/ends; a single word wider than
// the whole line (a long URL) is broken character by character.
const layoutLines = (writer: PdfWriter, runs: Run[], width: number, size: number): Piece[][] => {
  const lines: Piece[][] = [[]];
  let lineWidth = 0;

  const current = () => lines[lines.length - 1];

  const trimTrailingSpace = () => {
    const line = current();

    if (line.length > 0 && line[line.length - 1].text === ' ') {
      lineWidth -= line.pop()!.width;
    }
  };

  const newLine = () => {
    trimTrailingSpace();
    lines.push([]);
    lineWidth = 0;
  };

  runs.forEach((run) => {
    if ('hardBreak' in run) {
      newLine();
      return;
    }

    run.text
      .split(/(\s+)/)
      .filter(Boolean)
      .forEach((token) => {
        if (/^\s+$/.test(token)) {
          if (current().length > 0) {
            const spaceWidth = writer.measure(' ', run.style, size);
            current().push({text: ' ', style: run.style, width: spaceWidth});
            lineWidth += spaceWidth;
          }

          return;
        }

        let rest = token;
        let tokenWidth = writer.measure(rest, run.style, size);

        if (lineWidth + tokenWidth > width && current().length > 0) {
          newLine();
        }

        while (tokenWidth > width && rest.length > 1) {
          let cut = rest.length - 1;

          while (cut > 1 && writer.measure(rest.slice(0, cut), run.style, size) > width - lineWidth) {
            cut--;
          }

          const head = rest.slice(0, cut);
          current().push({text: head, style: run.style, width: writer.measure(head, run.style, size)});
          newLine();
          rest = rest.slice(cut);
          tokenWidth = writer.measure(rest, run.style, size);
        }

        current().push({text: rest, style: run.style, width: tokenWidth});
        lineWidth += tokenWidth;
      });
  });

  trimTrailingSpace();

  return lines;
};

const sameStyle = (a: InlineStyle, b: InlineStyle): boolean =>
  a.bold === b.bold && a.italic === b.italic && a.code === b.code && a.strike === b.strike && a.underline === b.underline && a.href === b.href && a.color === b.color;

// Adjacent pieces of the same style drawn as one text() call, so words stay
// one selectable/searchable string in the PDF instead of word-by-word.
const mergePieces = (line: Piece[]): Piece[] =>
  line.reduce<Piece[]>((merged, piece) => {
    const last = merged[merged.length - 1];

    if (last && sameStyle(last.style, piece.style)) {
      last.text += piece.text;
      last.width += piece.width;
    } else {
      merged.push({...piece});
    }

    return merged;
  }, []);

const drawLine = (writer: PdfWriter, line: Piece[], x: number, baseline: number, size: number, frameColor?: string) => {
  const {doc} = writer;
  const em = size * PT;
  let cursor = x;

  mergePieces(line).forEach((piece) => {
    const {style} = piece;

    if (style.code) {
      doc.setFillColor(COLORS.codeBackground);
      doc.rect(cursor - 0.4, baseline - em * 0.8, piece.width + 0.8, em * 1.05, 'F');
    }

    writer.setFont(style, size);
    const color = style.color ?? frameColor ?? COLORS.text;
    doc.setTextColor(color);
    doc.text(piece.text, cursor, baseline);

    if (style.underline || style.strike) {
      doc.setDrawColor(color);
      doc.setLineWidth(size * 0.06 * PT);

      if (style.underline) {
        doc.line(cursor, baseline + em * 0.12, cursor + piece.width, baseline + em * 0.12);
      }

      if (style.strike) {
        doc.line(cursor, baseline - em * 0.3, cursor + piece.width, baseline - em * 0.3);
      }
    }

    if (style.href) {
      doc.link(cursor, baseline - em * 0.8, piece.width, em, {url: style.href});
    }

    cursor += piece.width;
  });
};

// Room a heading reserves below itself - about three body lines - so it's
// never left alone at the bottom of a page with its section (a paragraph,
// or an image/table that can't split) starting on the next one.
const KEEP_WITH_NEXT = BODY_SIZE * PT * LINE_HEIGHT * 3;

// Lays out and draws a run of inline content line by line, breaking pages
// between lines. `keepWithNext` applies KEEP_WITH_NEXT to the first line.
const drawText = (writer: PdfWriter, runs: Run[], frame: Frame, size: number, keepWithNext = false) => {
  const lineHeight = size * PT * LINE_HEIGHT;
  const lines = layoutLines(writer, runs, frame.width, size);

  lines.forEach((line, index) => {
    writer.ensureSpace(lineHeight + (index === 0 && keepWithNext ? KEEP_WITH_NEXT : 0));
    const baseline = writer.y + size * PT * 1.05;
    writer.drawMarker(baseline, BODY_SIZE);
    drawLine(writer, line, frame.x, baseline, size, frame.color);
    writer.y += lineHeight;
  });
};

const blockGap = (frame: Frame): number => (frame.tight ? BODY_SIZE * PT * 0.25 : BODY_SIZE * PT * 0.7);

// Plain-text flattening for table cells - autotable cells are single-style
// strings, so bold/links inside a cell are lost but the text isn't.
const plainText = (node: JSONContent): string => {
  switch (node.type) {
    case 'text':
      return node.text ?? '';
    case 'hardBreak':
      return '\n';
    case 'mention':
      return `@${node.attrs?.label ?? ''}`;
    case 'ticketLink':
      return String(node.attrs?.label ?? '');
    case 'image':
      return node.attrs?.alt ? `[${node.attrs.alt}]` : '';
    case 'listItem':
      return `• ${(node.content ?? []).map(plainText).join('\n')}`;
    case 'paragraph':
    case 'heading':
      return (node.content ?? []).map(plainText).join('');
    default:
      return (node.content ?? []).map(plainText).join('\n');
  }
};

const drawImage = (writer: PdfWriter, image: PdfImage, frame: Frame, requestedWidthPx?: number) => {
  let width = Math.min((requestedWidthPx || image.width) * PX, frame.width);
  let height = (width * image.height) / image.width;
  const maxHeight = CONTENT_BOTTOM - MARGIN;

  if (height > maxHeight) {
    height = maxHeight;
    width = (height * image.width) / image.height;
  }

  writer.ensureSpace(height);
  writer.doc.addImage(image.dataUrl, 'JPEG', frame.x, writer.y, width, height);
  writer.y += height;
};

const drawPlaceholder = (writer: PdfWriter, text: string, frame: Frame) => {
  drawText(writer, [{text, style: {italic: true, color: COLORS.muted}}], frame, BODY_SIZE);
};

const drawCodeBlock = (writer: PdfWriter, code: string, frame: Frame) => {
  const {doc} = writer;
  const em = CODE_SIZE * PT;
  const lineHeight = em * 1.4;
  const padding = 2.5;

  doc.setFont(PDF_MONO_FONT, 'normal');
  doc.setFontSize(CODE_SIZE);
  const charsPerLine = Math.max(1, Math.floor((frame.width - padding * 2) / doc.getTextWidth('M')));

  const lines = code
    .replace(/\t/g, '    ')
    .split('\n')
    .flatMap((line) => {
      const chunks: string[] = [];

      for (let i = 0; i < line.length; i += charsPerLine) {
        chunks.push(line.slice(i, i + charsPerLine));
      }

      return chunks.length > 0 ? chunks : [''];
    });

  // Background drawn per line (plus top/bottom padding strips) rather than
  // as one box, so a block split across pages still gets a background on
  // both halves without having to precompute where the split lands.
  const fill = (height: number) => {
    doc.setFillColor(COLORS.codeBackground);
    doc.rect(frame.x, writer.y, frame.width, height, 'F');
    writer.y += height;
  };

  writer.ensureSpace(padding + lineHeight);
  writer.drawMarker(writer.y + padding + em, BODY_SIZE);
  fill(padding);

  lines.forEach((line, index) => {
    writer.ensureSpace(lineHeight + (index === lines.length - 1 ? padding : 0));
    const top = writer.y;
    fill(lineHeight);
    doc.setFont(PDF_MONO_FONT, 'normal');
    doc.setFontSize(CODE_SIZE);
    doc.setTextColor(COLORS.text);
    doc.text(line, frame.x + padding, top + em * 1.0);
  });

  fill(padding);
};

const drawTable = (writer: PdfWriter, node: JSONContent, frame: Frame) => {
  const toCell = (cell: JSONContent): CellDef => ({
    content: plainText(cell),
    colSpan: Number(cell.attrs?.colspan) || 1,
    rowSpan: Number(cell.attrs?.rowspan) || 1,
    styles: cell.type === 'tableHeader' ? {fontStyle: 'bold', fillColor: COLORS.codeBackground} : {},
  });

  const rows = (node.content ?? []).map((row) => (row.content ?? []).map(toCell));
  const firstRow = node.content?.[0]?.content ?? [];
  // A header row goes into `head`, so autotable repeats it on every page the
  // table spans.
  const hasHeaderRow = firstRow.length > 0 && firstRow.every((cell) => cell.type === 'tableHeader');

  writer.ensureSpace(BODY_SIZE * PT * 3);

  autoTable(writer.doc, {
    startY: writer.y,
    head: hasHeaderRow ? [rows[0] as RowInput] : undefined,
    body: (hasHeaderRow ? rows.slice(1) : rows) as RowInput[],
    theme: 'grid',
    margin: {left: frame.x, right: PAGE_WIDTH - frame.x - frame.width, top: MARGIN, bottom: MARGIN},
    styles: {font: PDF_FONT, fontSize: 9, cellPadding: 2, textColor: COLORS.text, lineColor: COLORS.border, lineWidth: 0.2, overflow: 'linebreak'},
    headStyles: {font: PDF_FONT, fontStyle: 'bold', fillColor: COLORS.codeBackground, textColor: COLORS.text},
  });

  writer.y = (writer.doc as jsPDF & {lastAutoTable: {finalY: number}}).lastAutoTable.finalY;
};

const renderBlocks = async (writer: PdfWriter, nodes: JSONContent[] | undefined, frame: Frame): Promise<void> => {
  for (const node of nodes ?? []) {
    await renderBlock(writer, node, frame);
  }
};

// Paragraphs can still carry an image node inline (depending on how the
// markdown was parsed) - split around it so the text flows and the image
// gets drawn as its own block.
const renderParagraph = async (writer: PdfWriter, node: JSONContent, frame: Frame) => {
  const content = node.content ?? [];

  if (content.length === 0) {
    writer.ensureSpace(BODY_SIZE * PT * LINE_HEIGHT);
    writer.drawMarker(writer.y + BODY_SIZE * PT * 1.05, BODY_SIZE);
    writer.y += BODY_SIZE * PT * LINE_HEIGHT;
    return;
  }

  let inline: JSONContent[] = [];

  const flush = () => {
    if (inline.length > 0) {
      drawText(writer, collectRuns(inline, {}), frame, BODY_SIZE);
      inline = [];
    }
  };

  for (const child of content) {
    if (child.type === 'image') {
      flush();
      await renderBlock(writer, child, frame);
    } else {
      inline.push(child);
    }
  }

  flush();
};

const renderList = async (writer: PdfWriter, node: JSONContent, frame: Frame) => {
  const ordered = node.type === 'orderedList';
  let number = Number(node.attrs?.start) || 1;
  const childFrame: Frame = {...frame, x: frame.x + LIST_INDENT, width: frame.width - LIST_INDENT, listDepth: frame.listDepth + 1, tight: true};

  for (const item of node.content ?? []) {
    writer.marker = {text: ordered ? `${number++}.` : BULLETS[frame.listDepth % BULLETS.length], rightX: frame.x + LIST_INDENT - 1.5};
    await renderBlocks(writer, item.content, childFrame);
    // An item with no drawable content - still print its bullet.
    writer.drawMarker(writer.y + BODY_SIZE * PT * 1.05, BODY_SIZE);
  }
};

async function renderBlock(writer: PdfWriter, node: JSONContent, frame: Frame): Promise<void> {
  // Only text blocks can place a list marker on their own first line; for
  // anything else (image, table, nested list as an item's first child) the
  // marker goes at the current position before the block is drawn.
  if (writer.marker && node.type !== 'paragraph' && node.type !== 'heading' && node.type !== 'codeBlock') {
    writer.ensureSpace(BODY_SIZE * PT * LINE_HEIGHT);
    writer.drawMarker(writer.y + BODY_SIZE * PT * 1.05, BODY_SIZE);
  }

  switch (node.type) {
    case 'paragraph':
      writer.space(blockGap(frame));
      await renderParagraph(writer, node, frame);
      return;

    case 'heading': {
      const size = HEADING_SIZES[Number(node.attrs?.level)] ?? BODY_SIZE;
      writer.space(frame.tight ? blockGap(frame) : size * PT * 0.8);
      drawText(writer, collectRuns(node.content, {bold: true}), frame, size, true);
      return;
    }

    case 'bulletList':
    case 'orderedList':
      writer.space(blockGap(frame));
      await renderList(writer, node, frame);
      return;

    case 'blockquote': {
      writer.space(blockGap(frame));
      const fromPage = writer.page;
      const fromY = writer.y;
      await renderBlocks(writer, node.content, {...frame, x: frame.x + QUOTE_INDENT, width: frame.width - QUOTE_INDENT, color: COLORS.muted});
      writer.verticalRule(frame.x + 1, fromPage, fromY, writer.page, writer.y);
      return;
    }

    case 'codeBlock': {
      writer.space(blockGap(frame));
      const code = (node.content ?? []).map(plainText).join('');

      if (node.attrs?.language === 'mermaid') {
        const diagram = await renderMermaidImage(code);

        if (diagram) {
          writer.drawMarker(writer.y + BODY_SIZE * PT * 1.05, BODY_SIZE);
          drawImage(writer, diagram, frame);
          return;
        }
      }

      drawCodeBlock(writer, code, frame);
      return;
    }

    case 'horizontalRule':
      writer.space(blockGap(frame));
      writer.ensureSpace(4);
      writer.doc.setDrawColor(COLORS.border);
      writer.doc.setLineWidth(0.3);
      writer.doc.line(frame.x, writer.y + 2, frame.x + frame.width, writer.y + 2);
      writer.y += 4;
      return;

    case 'table':
      writer.space(blockGap(frame));
      drawTable(writer, node, frame);
      return;

    case 'image': {
      writer.space(blockGap(frame));
      const src = String(node.attrs?.src ?? '');
      const image = src ? await loadPdfImage(src) : null;

      if (image) {
        drawImage(writer, image, frame, Number(node.attrs?.width) || undefined);
      } else {
        drawPlaceholder(writer, `[Image: ${node.attrs?.alt || src || 'unavailable'}]`, frame);
      }

      return;
    }

    // A video can't play on paper - a one-line label keeps its place visible.
    case 'attachment_video':
      writer.space(blockGap(frame));
      drawPlaceholder(writer, `[Video: ${node.attrs?.title || node.attrs?.src || 'attachment'}]`, frame);
      return;

    default:
      await renderBlocks(writer, node.content, frame);
  }
}

const drawPageNumbers = (doc: jsPDF) => {
  const total = doc.getNumberOfPages();

  if (total < 2) {
    return;
  }

  for (let page = 1; page <= total; page++) {
    doc.setPage(page);
    doc.setFont(PDF_FONT, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.muted);
    doc.text(`${page} / ${total}`, PAGE_WIDTH / 2, PAGE_HEIGHT - MARGIN / 2, {align: 'center'});
  }
};

// Keeps Polish letters in the file name (the OS handles them fine), only
// strips characters that are invalid in file names on Windows/macOS.
const toFileName = (title: string): string => `${title.replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, ' ').trim() || 'document'}.pdf`;

export const exportEditorPdf = async (content: JSONContent, title?: string): Promise<void> => {
  const doc = new jsPDF({unit: 'mm', format: 'a4'});
  await registerPdfFonts(doc);

  const writer = new PdfWriter(doc);
  const frame: Frame = {x: MARGIN, width: PAGE_WIDTH - MARGIN * 2, listDepth: 0, tight: false};
  const trimmedTitle = title?.trim();

  if (trimmedTitle) {
    doc.setProperties({title: trimmedTitle});
    drawText(writer, [{text: trimmedTitle, style: {bold: true}}], frame, 22, true);
    writer.y += 2;
    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(frame.x, writer.y, frame.x + frame.width, writer.y);
    writer.y += 3;
  }

  await renderBlocks(writer, content.content, frame);
  drawPageNumbers(doc);

  doc.save(toFileName(trimmedTitle ?? ''));
};
