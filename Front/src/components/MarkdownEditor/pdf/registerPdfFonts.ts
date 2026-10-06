import type {jsPDF} from 'jspdf';
import regularUrl from '@/assets/fonts/noto-sans/NotoSans-Regular.ttf?url';
import boldUrl from '@/assets/fonts/noto-sans/NotoSans-Bold.ttf?url';
import italicUrl from '@/assets/fonts/noto-sans/NotoSans-Italic.ttf?url';
import boldItalicUrl from '@/assets/fonts/noto-sans/NotoSans-BoldItalic.ttf?url';
import monoUrl from '@/assets/fonts/noto-sans/NotoSansMono-Regular.ttf?url';

export const PDF_FONT = 'NotoSans';
export const PDF_MONO_FONT = 'NotoSansMono';

type FontFile = {url: string; file: string; family: string; style: 'normal' | 'bold' | 'italic' | 'bolditalic'};

// jsPDF's 14 built-in fonts are WinAnsi-only - everything past Latin-1
// (ą, ę, ł, ś, ż, ź, ć, ń) comes out as raw garbage bytes, confirmed by
// dumping a generated PDF. An embedded TTF is the only fix, so these are
// Noto Sans (SIL OFL, see assets/fonts/noto-sans/OFL.txt), subset with
// pyftsubset to Latin + Latin Extended + general punctuation, no hinting and
// no layout tables (jsPDF doesn't read GSUB/GPOS anyway) - ~70 KB per face
// instead of ~600 KB.
const FONT_FILES: FontFile[] = [
  {url: regularUrl, file: 'NotoSans-Regular.ttf', family: PDF_FONT, style: 'normal'},
  {url: boldUrl, file: 'NotoSans-Bold.ttf', family: PDF_FONT, style: 'bold'},
  {url: italicUrl, file: 'NotoSans-Italic.ttf', family: PDF_FONT, style: 'italic'},
  {url: boldItalicUrl, file: 'NotoSans-BoldItalic.ttf', family: PDF_FONT, style: 'bolditalic'},
  {url: monoUrl, file: 'NotoSansMono-Regular.ttf', family: PDF_MONO_FONT, style: 'normal'},
];

type LoadedFont = FontFile & {base64: string};

const toBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const CHUNK = 0x8000;
  let binary = '';

  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }

  return btoa(binary);
};

// Fetched (?url, a separately cached asset) rather than ?inline - the fonts
// stay out of the JS chunk entirely and are only downloaded on the first
// export. Cached for the session afterwards; a failed load is NOT cached, so
// the next click retries instead of failing forever.
let fontsPromise: Promise<LoadedFont[]> | null = null;

const loadFonts = (): Promise<LoadedFont[]> => {
  fontsPromise ??= Promise.all(
    FONT_FILES.map(async (font) => {
      const response = await fetch(font.url);

      if (!response.ok) {
        throw new Error(`Failed to load PDF font ${font.file} (${response.status})`);
      }

      return {...font, base64: toBase64(await response.arrayBuffer())};
    }),
  ).catch((error) => {
    fontsPromise = null;
    throw error;
  });

  return fontsPromise;
};

export const registerPdfFonts = async (doc: jsPDF): Promise<void> => {
  for (const font of await loadFonts()) {
    doc.addFileToVFS(font.file, font.base64);
    doc.addFont(font.file, font.family, font.style);
  }

  doc.setFont(PDF_FONT, 'normal');
};
