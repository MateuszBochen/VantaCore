import mermaid from 'mermaid';
import {getAttachmentBlobByPath} from '@/lib/Attachment/getAttachmentBlob';
import {ATTACHMENT_SRC_PATTERN} from '../tiptap/attachmentSrcPattern';

export type PdfImage = {
  dataUrl: string;
  // Natural size in CSS px - what the PDF layout scales from, independent of
  // how many pixels the raster itself ended up with.
  width: number;
  height: number;
};

// Caps the raster so a 4000px screenshot doesn't bloat the PDF - ~2x the
// printable width of an A4 page at 96dpi, still sharp when zoomed.
const MAX_RASTER_WIDTH = 1600;

// Everything goes through a canvas and out as JPEG, whatever the source
// format: jsPDF only reliably embeds JPEG/PNG (not webp/gif/svg), and JPEG
// keeps screenshots a fraction of PNG's size. Painted onto white first, since
// JPEG has no alpha and transparent areas would otherwise turn black.
const rasterize = (url: string, scale = 1): Promise<PdfImage | null> =>
  new Promise((resolve) => {
    const image = new Image();

    if (/^https?:/i.test(url)) {
      // External URL pasted via the toolbar's URL fallback - without CORS
      // the canvas is tainted and toDataURL throws, caught below.
      image.crossOrigin = 'anonymous';
    }

    image.onload = () => {
      try {
        const width = image.naturalWidth;
        const height = image.naturalHeight;

        if (!width || !height) {
          resolve(null);
          return;
        }

        const ratio = Math.min(scale, MAX_RASTER_WIDTH / width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(width * ratio));
        canvas.height = Math.max(1, Math.round(height * ratio));

        const context = canvas.getContext('2d');

        if (!context) {
          resolve(null);
          return;
        }

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        resolve({dataUrl: canvas.toDataURL('image/jpeg', 0.9), width, height});
      } catch {
        resolve(null);
      }
    };

    image.onerror = () => resolve(null);
    image.src = url;
  });

// Attachment images need the same authenticated blob fetch AttachmentImage's
// node view does (a plain URL would 401); anything else is loaded directly.
// null = couldn't be loaded, the caller prints a placeholder instead.
export const loadPdfImage = async (src: string): Promise<PdfImage | null> => {
  if (!ATTACHMENT_SRC_PATTERN.test(src)) {
    return rasterize(src);
  }

  const result = await getAttachmentBlobByPath(src);

  if (!result.success) {
    return null;
  }

  const objectUrl = URL.createObjectURL(result.blob);

  try {
    return await rasterize(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

// Per-render init directive, NOT mermaid.initialize(): MermaidBlock
// re-initializes mermaid's global config with the current app theme on every
// render, so touching the global here would leak into the live editor (and
// vice versa). The directive forces a light palette for paper whatever theme
// the app is in, and turns off htmlLabels - HTML labels are <foreignObject>,
// which taints the canvas in rasterize() so toDataURL would throw.
const MERMAID_PDF_DIRECTIVE = `%%{init: ${JSON.stringify({
  theme: 'base',
  htmlLabels: false,
  flowchart: {htmlLabels: false},
  themeVariables: {
    background: '#ffffff',
    primaryColor: '#f3f4f6',
    primaryTextColor: '#111827',
    primaryBorderColor: '#9ca3af',
    lineColor: '#4b5563',
    secondaryColor: '#e5e7eb',
    tertiaryColor: '#f9fafb',
    textColor: '#111827',
    mainBkg: '#f3f4f6',
    nodeBorder: '#9ca3af',
    clusterBkg: '#f9fafb',
    clusterBorder: '#d1d5db',
    edgeLabelBackground: '#ffffff',
  },
})}}%%`;

let mermaidRenderCount = 0;

// Rendered fresh from the node's source (not grabbed from the live editor's
// SVG) so it gets the paper palette above. Mermaid's SVG only carries a
// viewBox and width="100%", which an <img> can't size - the viewBox
// dimensions are written back as explicit width/height first. Rasterized at
// 2x so diagram text stays crisp. null on any failure (invalid diagram, a
// diagram type that still emits foreignObject) - the caller falls back to
// printing the source as a code block.
export const renderMermaidImage = async (code: string): Promise<PdfImage | null> => {
  try {
    mermaidRenderCount += 1;
    const {svg} = await mermaid.render(`pdf-mermaid-${mermaidRenderCount}`, `${MERMAID_PDF_DIRECTIVE}\n${code}`);

    const root = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
    const viewBox = root.getAttribute('viewBox')?.split(/[\s,]+/).map(Number);

    if (!viewBox || viewBox.length !== 4 || !viewBox[2] || !viewBox[3]) {
      return null;
    }

    root.setAttribute('width', String(viewBox[2]));
    root.setAttribute('height', String(viewBox[3]));
    root.removeAttribute('style');

    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(root))}`;

    return await rasterize(url, 2);
  } catch {
    return null;
  }
};
