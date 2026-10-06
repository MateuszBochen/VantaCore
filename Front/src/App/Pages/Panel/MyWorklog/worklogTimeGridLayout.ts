import {minutesSinceMidnightLocal} from '@/lib/Worklog/dateRange';
import type {MyWorklogEntry} from '@/lib/Worklog/Type/types';

export type LaidOutEntry = {
  entry: MyWorklogEntry;
  topPx: number;
  heightPx: number;
  leftPercent: number;
  widthPercent: number;
};

const MIN_BLOCK_HEIGHT_PX = 20;

// One day's entries, positioned on an hour-tall grid. Entries whose logged
// duration would cross midnight are clipped to the day's end rather than
// split across day columns - WorklogTimeGrid never renders a single entry
// spanning two columns.
//
// Overlapping entries (possible for manually-logged/backdated time, not
// just the stopwatch) get packed into side-by-side lanes via the standard
// calendar sweep-line algorithm: sort by start, merge into overlap
// clusters, greedily assign each entry the first lane whose previous
// occupant already ended. This is the same simplified (not
// maximum-clique-optimal) packing every mainstream calendar UI uses - an
// entry doesn't back-fill a lane freed up by a *later* entry in the same
// cluster, which is a deliberate simplicity trade-off, not a bug.
export const computeDayLayout = (entries: MyWorklogEntry[], totalHeightPx: number): LaidOutEntry[] => {
  const sorted = entries
    .map((entry) => {
      const start = minutesSinceMidnightLocal(entry.dateTime);
      return {entry, start, end: Math.min(1440, start + entry.minutes)};
    })
    .sort((a, b) => a.start - b.start);

  const laidOut: LaidOutEntry[] = [];
  let clusterStart = 0;

  while (clusterStart < sorted.length) {
    let clusterEnd = sorted[clusterStart].end;
    let clusterLast = clusterStart;

    while (clusterLast + 1 < sorted.length && sorted[clusterLast + 1].start < clusterEnd) {
      clusterLast += 1;
      clusterEnd = Math.max(clusterEnd, sorted[clusterLast].end);
    }

    const cluster = sorted.slice(clusterStart, clusterLast + 1);
    const laneEnds: number[] = [];
    const lanes: number[] = [];

    cluster.forEach((item) => {
      let lane = laneEnds.findIndex((end) => end <= item.start);
      if (lane === -1) {
        lane = laneEnds.length;
      }
      laneEnds[lane] = item.end;
      lanes.push(lane);
    });

    const laneCount = laneEnds.length;

    cluster.forEach((item, index) => {
      const topPx = (item.start / 1440) * totalHeightPx;
      const heightPx = Math.min(Math.max(MIN_BLOCK_HEIGHT_PX, ((item.end - item.start) / 1440) * totalHeightPx), totalHeightPx - topPx);

      laidOut.push({
        entry: item.entry,
        topPx,
        heightPx,
        leftPercent: (lanes[index] / laneCount) * 100,
        widthPercent: 100 / laneCount,
      });
    });

    clusterStart = clusterLast + 1;
  }

  return laidOut;
};
