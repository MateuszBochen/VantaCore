import type {ImportPreview} from './Type/types';

const PREVIEW_ROW_COUNT = 20;

// Naive comma split - good enough for the preview UI (header + first N
// rows); the real parse of the whole file happens server-side once the job
// runs (see the sub-project's Solution Design), so this never needs to
// handle every CSV edge case, just render something sensible to map against.
const splitCsvLine = (line: string): string[] => line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''));

const parseCsvPreview = (file: File): Promise<ImportPreview> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const text = String(reader.result ?? '');
      const lines = text.split(/\r?\n/).filter((line) => line.length > 0);

      if (lines.length === 0) {
        resolve({fields: [], rows: []});
        return;
      }

      const fields = splitCsvLine(lines[0]);
      const rows = lines.slice(1, 1 + PREVIEW_ROW_COUNT).map((line) => {
        const cells = splitCsvLine(line);
        return Object.fromEntries(fields.map((field, index) => [field, cells[index] ?? '']));
      });

      resolve({fields, rows});
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

export default parseCsvPreview;
