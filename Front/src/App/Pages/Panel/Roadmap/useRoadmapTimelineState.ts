import {useCallback, useEffect, useState} from 'react';
import useListRoadmapEntriesHook from '@/lib/Roadmap/useListRoadmapEntriesHook';
import useListProjectsHook from '@/lib/Project/useListProjectsHook';
import type {RoadmapRelease} from '@/lib/Roadmap/Type/types';
import {addDays, todayIso} from '@/lib/Worklog/dateRange';

const MIN_WEEKS_VISIBLE = 4;
const MAX_WEEKS_VISIBLE = 52;
// Scroll-to-zoom fires handleZoom on every wheel tick - without a debounce,
// a single scroll gesture spanning 10 weeks changes weeksVisible 5 times and
// fires 5 fetches in a row, all but the last one wasted.
const FETCH_DEBOUNCE_MS = 300;

// Everything RoadmapTimeline needs, minus rendering - shared between
// RoadmapPage (the full /roadmap page) and RoadmapWidget (the Dashboard
// card), so the zoom/pan/fetch/save-patch logic isn't duplicated between
// a full page and a compact preview of the exact same data.
const useRoadmapTimelineState = (defaultWeeksVisible: number) => {
  const {listRoadmapEntries} = useListRoadmapEntriesHook();
  const {listProjects} = useListProjectsHook();

  // The midpoint of the visible window, not its start - Prev/Next/Today pan
  // this, and zooming (see weeksVisible below) grows/shrinks the window
  // symmetrically AROUND it. windowStart is derived from this every render
  // (see below) rather than stored directly, so zooming can never silently
  // only extend the window into the future the way a stored windowStart did.
  const [center, setCenter] = useState(() => todayIso());
  // The actual "zoom level" - mouse-wheel over the timeline changes this
  // (see RoadmapTimeline's own wheel handler), which widens/narrows the
  // from/till fetched below. Deliberately NOT a fixed pixel-per-day zoom
  // (an earlier pass did that) - squeezing the same already-fetched weeks
  // into fewer pixels isn't "seeing more of the roadmap", it's just
  // shrinking the columns. Zooming out has to actually fetch and reveal
  // more real weeks of releases.
  const [weeksVisible, setWeeksVisible] = useState(defaultWeeksVisible);
  // null = never loaded yet (first render's own loading state) - re-paging
  // the window (Prev/Next/Today) replaces this in place once the new page
  // resolves rather than flashing back to null, so the timeline doesn't
  // blank out on every navigation (same shape as VersionTrackerPage's own
  // `releases: Release[] | null`).
  const [releases, setReleases] = useState<RoadmapRelease[] | null>(null);
  const [projectNamesById, setProjectNamesById] = useState<Map<string, string>>(new Map());

  // weeksVisible only ever changes by +/-2 (see handleZoom), so it stays
  // even and this split is always exactly symmetric - half the visible span
  // before `center`, half after.
  const windowStart = addDays(center, -Math.floor(weeksVisible / 2) * 7);

  useEffect(() => {
    listProjects().then((result) => {
      if (result.success) {
        setProjectNamesById(new Map(result.projects.map((project) => [project.id, project.name])));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listProjects is a thin useRequestHook wrapper recreated every render; fetched once
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Debounced, not immediate - center/weeksVisible can change several
    // times in quick succession (a single scroll-to-zoom gesture, or
    // holding down Prev/Next), and only the settled end state is worth
    // fetching. Each change resets this timer via the cleanup below, so
    // only the last one within FETCH_DEBOUNCE_MS actually reaches the API.
    const timeoutId = setTimeout(() => {
      const from = addDays(center, -Math.floor(weeksVisible / 2) * 7);
      const till = addDays(center, Math.ceil(weeksVisible / 2) * 7);

      listRoadmapEntries(from, till).then((result) => {
        if (!cancelled) {
          setReleases(result.success ? result.releases : []);
        }
      });
    }, FETCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listRoadmapEntries is a thin useRequestHook wrapper recreated every render
  }, [center, weeksVisible]);

  // Stable identity - RoadmapTimeline's own wheel-listener effect depends on
  // this, and an inline arrow recreated every render would tear down/re-
  // attach that native listener on every zoom tick's own re-render.
  const handleZoom = useCallback((direction: 'in' | 'out') => {
    setWeeksVisible((current) => {
      // Additive, not exponential - a "week" is already a meaningful,
      // discrete unit here (unlike the earlier pixel-density attempt), so a
      // steady +/-2 per wheel tick reads more predictably than a
      // multiplicative curve would.
      const next = direction === 'in' ? current - 2 : current + 2;
      return Math.min(MAX_WEEKS_VISIBLE, Math.max(MIN_WEEKS_VISIBLE, next));
    });
  }, []);

  const handlePan = useCallback((deltaDays: number) => {
    setCenter((current) => addDays(current, deltaDays));
  }, []);

  const handleToday = useCallback(() => {
    setCenter(todayIso());
  }, []);

  // Patches the one release that changed in place rather than refetching -
  // RoadmapReleasePanel already has the post-save shape (it built it from
  // its own local edits + the save's success), so there's nothing a refetch
  // would learn that isn't already known here.
  const handleReleaseSaved = useCallback((updated: RoadmapRelease) => {
    setReleases((current) => current?.map((release) => (release.id === updated.id ? updated : release)) ?? current);
  }, []);

  return {
    releases: releases ?? [],
    loading: releases === null,
    projectNamesById,
    windowStart,
    weeksVisible,
    onPan: handlePan,
    onToday: handleToday,
    onZoom: handleZoom,
    onReleaseSaved: handleReleaseSaved,
  };
};

export default useRoadmapTimelineState;
