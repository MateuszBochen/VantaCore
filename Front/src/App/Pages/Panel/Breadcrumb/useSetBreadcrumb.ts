import {useEffect} from 'react';
import {useBreadcrumbContext} from './context';
import type {BreadcrumbSegment} from '@/components/PrismMenu';

// Write side, used by pages the PrismMenu tree doesn't cover - Users/Roles/
// Profile/Application settings are reached via UserBadge's dropdown, not the
// sidebar, so useBreadcrumb's default (derived from that tree) has nothing
// to walk for their routes. Pages already in the tree (Projects, Sprints)
// get a correct breadcrumb for free and don't need to call this. Same
// auto-clear-on-unmount convention as useSetModuleTitle.
export const useSetBreadcrumb = (segments: BreadcrumbSegment[] | null): void => {
  const {setOverride} = useBreadcrumbContext();
  // `segments` is a fresh array/object literal on every render for most
  // callers (e.g. `useSetBreadcrumb([{label: 'Users', link: null}])`) - a
  // plain string title can lean on primitive equality in the effect's
  // dependency array, an array can't. Flattening to a string key is the
  // same "arrays aren't referentially stable" fix used elsewhere in this
  // app (e.g. useSprintRail's ticketId-joined dependency).
  const key = segments?.map((segment) => `${segment.label}::${segment.link ?? ''}`).join('>>') ?? null;

  useEffect(() => {
    setOverride(segments);
    return () => setOverride(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` (not `segments`) is the real, value-stable dependency - see comment above
  }, [key, setOverride]);
};
