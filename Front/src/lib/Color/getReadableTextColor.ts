// WCAG relative luminance (https://www.w3.org/TR/WCAG21/#dfn-relative-luminance),
// used to pick whichever of pure white/near-black has the higher contrast
// ratio against an arbitrary user-picked hex color - a same-hue colored
// label on a same-hue tinted background (e.g. red text on a red badge) can
// read as low-contrast even when the badge's own border/bg is readable
// against the page, since text and background luminance end up too close
// to each other regardless of hue.
const relativeLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map((channel) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

// The luminance at which white text (luminance 1) and black text
// (luminance 0) have an EQUAL WCAG contrast ratio against the background -
// solved from the contrast ratio formula, not a rounded guess.
const CROSSOVER_LUMINANCE = 0.179;

export const getReadableTextColor = (hex: string): string => {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  return relativeLuminance(r, g, b) > CROSSOVER_LUMINANCE ? '#18181b' : '#ffffff';
};
