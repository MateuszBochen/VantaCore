// Kept in its own module, not co-located with SprintRailBoard's default
// export - a non-component value export next to it broke Vite's fast
// refresh (full reload instead of HMR) on every edit to that file.
//
// A status id alone doesn't identify a unique StatusMeta any more (see the
// Status & Workflow Model sub-project) - the same shared status can be used
// by several issue types, each with its own workflow (allowedTransitionIds)
// for it. Every lookup needs both ids.
export const statusKey = (issueTypeId: string, statusId: string): string => `${issueTypeId}:${statusId}`;
