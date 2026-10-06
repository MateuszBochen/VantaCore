// Confirmed 2026-08-16: only two values, exact casing - "PLAN" (not
// "PLANNED"). Kept separate from the type itself so it's a one-line fix if
// the backend's enum ever grows.
export const RELEASE_STATUSES: {id: string; label: string}[] = [
  {id: 'PLAN', label: 'Plan'},
  {id: 'RELEASED', label: 'Released'},
];

// Falls back to the raw value rather than hiding it - a status coming back
// from the backend that isn't one of the three above should still be
// visible (not silently blanked), same "don't hide unrecognized data"
// convention as UserChip's own fallback.
export const getReleaseStatusLabel = (status: string): string => RELEASE_STATUSES.find((candidate) => candidate.id === status)?.label ?? status;
