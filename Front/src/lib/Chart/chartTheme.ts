import type {CSSProperties} from 'react';

// Theme-aware styling shared by every Recharts chart (Project overview,
// Sprint velocity/burndown): tooltip, grid, axes, hover cursor, legend.
// All theme tokens, so charts follow neon-blaster/dark/light like the rest
// of the UI. Recharts writes these into SVG presentation attributes
// (stroke/fill), where var() resolves the same as in CSS.
//
// Tooltip - theme tokens instead of the hardcoded
// '#1a1a19' box each chart used to copy, so the tooltip follows
// neon-blaster/dark/light like every other popover. The hardcoded version
// never set a text color at all: Recharts colors each row by its series,
// and a chart whose bars are colored per <Cell> has no series color, so it
// fell back to black - "count: 3" in black on a near-black box.
export const CHART_TOOLTIP_CONTENT_STYLE: CSSProperties = {
  background: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--popover-foreground)',
};

export const CHART_TOOLTIP_LABEL_STYLE: CSSProperties = {
  color: 'var(--popover-foreground)',
  fontWeight: 500,
};

// Single-series charts only - multi-series ones (Committed vs Completed)
// keep Recharts' per-series row color, which is what tells the rows apart.
export const CHART_TOOLTIP_ITEM_STYLE: CSSProperties = {
  color: 'var(--popover-foreground)',
};

// Grid lines - the lightest structural line, same token as every border.
export const CHART_GRID_STROKE = 'var(--border)';

// Axis tick labels (Recharts colors tick text from the axis `stroke`) and
// the axis line itself, when a chart draws one.
export const CHART_AXIS_STROKE = 'var(--muted-foreground)';
export const CHART_AXIS_LINE = {stroke: 'var(--border)'};

// Bar-chart hover band. --border rather than --muted: on the light theme
// --muted is the card color itself, so the band would be invisible.
export const CHART_CURSOR = {fill: 'var(--border)', fillOpacity: 0.35};

// Legend text - text color, never the series color (the swatch carries it).
export const CHART_LEGEND_STYLE = {fontSize: 11, color: 'var(--muted-foreground)'};
