// See plan: konfigurowalny układ widoku ticketu. One id per section that can
// appear on the widget grid - 'default' layout only ever places
// description/prismSidebar (see ticketLayoutTemplates.ts), the rest exist
// for devops/jira/custom.
export type WidgetId =
  | 'description'
  | 'prismSidebar'
  | 'fields'
  | 'customFields'
  | 'worklog'
  | 'children'
  | 'related'
  | 'development'
  | 'testCases'
  | 'comments'
  | 'attachments';

// react-grid-layout's own coordinate convention: a 12-column grid, x/y/w/h
// all in grid units (not pixels) - row height is fixed in TicketWidgetGrid.
export type WidgetLayoutItem = {
  widgetId: WidgetId;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type TicketLayoutSlot = 'default' | 'devops' | 'jira' | 'custom';

// Persisted shape (localStorage in Faza 1/2, backend in Faza 3) - `slots`
// only ever holds a user's OWN edits/deviations from the built-in templates
// (see ticketLayoutTemplates.ts); a null entry means "use the built-in
// template for this slot unmodified". `slots.default` is always null/unused
// - the 'default' slot's grid only ever backs the small 2-widget 'ticket'
// step (see TicketEditor.tsx), kept here only so `activeSlot` has something
// to point at.
export type UserTicketLayoutPreference = {
  activeSlot: TicketLayoutSlot;
  slots: Record<TicketLayoutSlot, WidgetLayoutItem[] | null>;
};
