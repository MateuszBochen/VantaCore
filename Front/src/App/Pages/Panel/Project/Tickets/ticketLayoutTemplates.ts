import type {TicketLayoutSlot, UserTicketLayoutPreference, WidgetLayoutItem} from '@/lib/TicketLayout/Type/types';

// react-grid-layout convention: 12 columns, x/y/w/h in grid units.
// TicketWidgetGrid.tsx picks the row height in px these h values multiply
// against - see its own GRID_ROW_HEIGHT constant.
export const GRID_COLUMNS = 12;

// The 'default' slot's grid still only ever backs the 'ticket' Stepper step
// (see TicketEditor.tsx) - Children/Worklog/Development/Test Cases/Comments/
// Attachments stay off it entirely, as separate Stepper steps exactly like
// today. Sized to roughly replicate today's wide-description / 320px-
// sidebar split.
const DEFAULT_TEMPLATE: WidgetLayoutItem[] = [
  {widgetId: 'description', x: 0, y: 0, w: 8, h: 20},
  {widgetId: 'prismSidebar', x: 8, y: 0, w: 4, h: 20},
];

// Opis+Comments | Fields+Custom Fields | Worklog+Children+Related+Development,
// Test Cases/Attachments appended to the third column (not shown in the
// original mockup, but "wszystkie sekcje są widgetami" applies to them too).
const DEVOPS_TEMPLATE: WidgetLayoutItem[] = [
  {widgetId: 'description', x: 0, y: 0, w: 4, h: 16},
  {widgetId: 'comments', x: 0, y: 16, w: 4, h: 14},
  {widgetId: 'fields', x: 4, y: 0, w: 4, h: 14},
  {widgetId: 'customFields', x: 4, y: 14, w: 4, h: 10},
  {widgetId: 'worklog', x: 8, y: 0, w: 4, h: 10},
  {widgetId: 'children', x: 8, y: 10, w: 4, h: 10},
  {widgetId: 'related', x: 8, y: 20, w: 4, h: 10},
  {widgetId: 'development', x: 8, y: 30, w: 4, h: 10},
  {widgetId: 'testCases', x: 8, y: 40, w: 4, h: 12},
  {widgetId: 'attachments', x: 8, y: 52, w: 4, h: 10},
];

// Szeroka lewa (Opis+Children+Related+Comments) | wąska prawa (Fields+Custom
// Fields), Test Cases/Development/Attachments appended to the wide left
// column (same "not in the original mockup but still a widget" reasoning
// as DEVOPS_TEMPLATE above).
const JIRA_TEMPLATE: WidgetLayoutItem[] = [
  {widgetId: 'description', x: 0, y: 0, w: 8, h: 14},
  {widgetId: 'children', x: 0, y: 14, w: 8, h: 10},
  {widgetId: 'related', x: 0, y: 24, w: 8, h: 10},
  {widgetId: 'comments', x: 0, y: 34, w: 8, h: 14},
  {widgetId: 'development', x: 0, y: 48, w: 8, h: 10},
  {widgetId: 'testCases', x: 0, y: 58, w: 8, h: 12},
  {widgetId: 'attachments', x: 0, y: 70, w: 8, h: 10},
  {widgetId: 'fields', x: 8, y: 0, w: 4, h: 14},
  {widgetId: 'customFields', x: 8, y: 14, w: 4, h: 10},
  {widgetId: 'worklog', x: 8, y: 24, w: 4, h: 10},
];

// Every slot's built-in starting layout - all three back the 'ticket' step's
// TicketWidgetGrid (see TicketEditor.tsx); 'default' just has far fewer
// widgets on it (the rest of its steps stay off-grid, see DEFAULT_TEMPLATE's
// own comment). 'custom' has no built-in entry - it starts as an empty grid
// until a user places something (Faza 2).
export const BUILT_IN_GRID_TEMPLATES: Partial<Record<TicketLayoutSlot, WidgetLayoutItem[]>> = {
  default: DEFAULT_TEMPLATE,
  devops: DEVOPS_TEMPLATE,
  jira: JIRA_TEMPLATE,
};

// A user's own edit (preference.slots[slot]) always wins over the built-in
// starting point for that slot - Faza 1 never actually populates an edit
// (no editor yet), so this only ever resolves to the built-in template today,
// but the lookup already accounts for Faza 2 writing one.
export const resolveGridLayout = (preference: UserTicketLayoutPreference, slot: TicketLayoutSlot): WidgetLayoutItem[] =>
  preference.slots[slot] ?? BUILT_IN_GRID_TEMPLATES[slot] ?? [];

// isNew only ever has 2-4 widgets available (description/prismSidebar/
// fields/customFields - everything else needs a persisted ticket, see
// WIDGETS_REQUIRING_PERSISTED_TICKET), but the saved layout's own x/y/w/h
// were sized assuming every widget the slot normally has - devops/jira in
// particular reserve whole columns for Worklog/Children/Related/etc. With
// isNew filtering those widgets away, TicketWidgetGrid kept their leftover
// grid cells empty rather than reclaiming them.
//
// Reclaims that space WITHOUT collapsing the design's own column structure
// (a first pass did that - stacked everything full-width in one column,
// which threw away e.g. devops' side-by-side description/fields split even
// when both survive isNew just fine): widgets are grouped by which ORIGINAL
// column they started in (their x), any column that loses every widget it
// had disappears entirely, and the surviving columns' widths are rescaled
// proportionally so they still sum to the full 12 - a 4/4/4 three-column
// template with only the first two columns surviving becomes a 6/6 split,
// not 4/4 with 4 columns of dead space. Within each surviving column,
// widgets are also vertically re-stacked (closing the gap left by any
// removed widget above them), keeping their own original relative order.
// Reduces to the identity transform when nothing was actually filtered out
// (every original column still sums its own width), so this is safe to
// apply unconditionally rather than needing a "did anything change" guard.
export const buildIsNewLayout = (layout: WidgetLayoutItem[], availableWidgetIds: readonly string[]): WidgetLayoutItem[] => {
  const available = new Set(availableWidgetIds);
  const survivors = layout.filter((item) => available.has(item.widgetId));

  const columnsByX = new Map<number, WidgetLayoutItem[]>();
  survivors.forEach((item) => {
    const column = columnsByX.get(item.x) ?? [];
    column.push(item);
    columnsByX.set(item.x, column);
  });

  const columns = [...columnsByX.entries()]
    .sort(([xA], [xB]) => xA - xB)
    .map(([, items]) => items.sort((a, b) => a.y - b.y));

  const originalColumnWidths = columns.map((items) => Math.max(...items.map((item) => item.w)));
  const totalOriginalWidth = originalColumnWidths.reduce((sum, w) => sum + w, 0) || 1;

  // Proportional rounding can under/overshoot GRID_COLUMNS by a column or
  // two - corrected on the LAST column only, so every column but the last
  // gets its exact rounded share and the last one absorbs the remainder
  // (matches how the built-in templates themselves size their own last
  // column, e.g. DEVOPS_TEMPLATE's third column).
  const newWidths = originalColumnWidths.map((w) => Math.round((w / totalOriginalWidth) * GRID_COLUMNS));
  const widthSum = newWidths.reduce((sum, w) => sum + w, 0);
  if (newWidths.length > 0) {
    newWidths[newWidths.length - 1] += GRID_COLUMNS - widthSum;
  }

  let nextX = 0;
  const result: WidgetLayoutItem[] = [];

  columns.forEach((items, columnIndex) => {
    const columnWidth = newWidths[columnIndex];
    let nextY = 0;

    items.forEach((item) => {
      result.push({...item, x: nextX, y: nextY, w: columnWidth});
      nextY += item.h;
    });

    nextX += columnWidth;
  });

  return result;
};
