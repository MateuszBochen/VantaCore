// Not a confirmed backend enum (the Audit Log endpoint doesn't exist yet) -
// this is every domain object in the app substantial enough to plausibly
// need audit coverage, per that sub-project's own "capture on all mutating
// endpoints" scope. Kept as one list so the filter dropdown and
// buildAuditResourceLink's routing can't quietly drift apart - confirm
// against the real enum once CWJ-12 ships and adjust both from here.
export const AUDIT_RESOURCE_TYPES: {value: string; label: string}[] = [
  {value: 'TICKET', label: 'Ticket'},
  {value: 'PROJECT', label: 'Project'},
  {value: 'SUB_PROJECT', label: 'Sub-project'},
  {value: 'BOARD', label: 'Board'},
  {value: 'SPRINT', label: 'Sprint'},
  {value: 'AUTOMATION_RULE', label: 'Automation rule'},
  {value: 'RELEASE', label: 'Release'},
  {value: 'COMMENT', label: 'Comment'},
  {value: 'WORKLOG', label: 'Worklog'},
];
