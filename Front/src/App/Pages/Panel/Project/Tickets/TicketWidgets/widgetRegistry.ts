import type {TicketLayoutSlot, WidgetId, WidgetLayoutItem} from '@/lib/TicketLayout/Type/types';

// Human title per widget - used for Faza 2's edit-mode placeholder tiles
// (not built yet) and anywhere else a label is needed without loading the
// real section. Not rendered as an extra header today: each section already
// titles itself where it matters (e.g. TicketRelatedSection's own "Related
// tickets" heading) - see TicketWidgetCard's own comment.
export const WIDGET_TITLES: Record<WidgetId, string> = {
  description: 'Description',
  prismSidebar: 'Fields (classic)',
  fields: 'Fields',
  customFields: 'Custom Fields',
  worklog: 'Worklog',
  children: 'Children',
  related: 'Related',
  development: 'Development',
  testCases: 'Test Cases',
  comments: 'Comments',
  attachments: 'Attachments',
};

// Widgets that need a persisted (non-isNew) ticket to have anything to show
// - everything else (description/fields/customFields/prismSidebar) works
// against a fresh draft too. Matches today's `!isNew &&` guards in
// TicketEditor.tsx.
export const WIDGETS_REQUIRING_PERSISTED_TICKET: ReadonlySet<WidgetId> = new Set([
  'worklog',
  'children',
  'related',
  'development',
  'testCases',
  'comments',
  'attachments',
]);

const ALL_WIDGET_IDS: WidgetId[] = [
  'description',
  'prismSidebar',
  'fields',
  'customFields',
  'worklog',
  'children',
  'related',
  'development',
  'testCases',
  'comments',
  'attachments',
];

// The 'default' slot's grid only ever backs its own tiny 2-widget 'ticket'
// step (see ticketLayoutTemplates.ts's own DEFAULT_TEMPLATE comment) -
// everything else it has (Children, Worklog, ...) still lives as a separate
// Stepper step outside the grid entirely. Letting the editor add one of
// those to 'default's grid too would render it TWICE (once as the widget,
// once as its still-existing Stepper step) - so 'default' can only
// rearrange/resize the 2 it already has, never add a new widget type.
// devops/jira/custom have no such off-grid steps to collide with, so they
// get the full catalog.
export const editableWidgetIdsForSlot = (slot: TicketLayoutSlot): WidgetId[] =>
  slot === 'default' ? ['description', 'prismSidebar'] : ALL_WIDGET_IDS;

// Grid units (12-column, same convention as ticketLayoutTemplates.ts) a
// freshly-added widget starts at before the user drags/resizes it further.
export const WIDGET_DEFAULT_SIZE: Record<WidgetId, {w: number; h: number}> = {
  description: {w: 6, h: 16},
  prismSidebar: {w: 4, h: 20},
  fields: {w: 4, h: 14},
  customFields: {w: 4, h: 10},
  worklog: {w: 4, h: 14},
  children: {w: 4, h: 10},
  related: {w: 4, h: 10},
  development: {w: 4, h: 10},
  testCases: {w: 4, h: 12},
  comments: {w: 4, h: 14},
  attachments: {w: 4, h: 10},
};

// A widget resized/placed smaller than this becomes unusable (and, for a
// freshly-dropped one, hard to grab again) - applied to every tile while
// the grid is in edit mode, regardless of what's actually persisted.
export const WIDGET_MIN_SIZE = {w: 2, h: 4};

// Where a newly-added widget lands: below everything already on the grid,
// full-width-of-its-default-size starting at the left edge - never
// overlapping what's already placed, and always somewhere the user can
// immediately see and drag from without hunting for it.
export const nextWidgetPosition = (currentLayout: WidgetLayoutItem[]): {x: number; y: number} => ({
  x: 0,
  y: currentLayout.reduce((maxY, item) => Math.max(maxY, item.y + item.h), 0),
});
