import {PageContainer} from '@/components/ui/page-container';
import RoadmapTimeline from './RoadmapTimeline';
import useRoadmapTimelineState from './useRoadmapTimelineState';
import {useSetModuleTitle} from '../ModuleTitle';

const DEFAULT_WEEKS_VISIBLE = 16;

// Cross-project, like Boards/My tickets/My worklog - not nested under
// /projects/:id/*, see WorkPlace.tsx. Built directly on Version Tracker's
// Release resource (GET /api/roadmap-entry aggregates every project's
// releases in one call) rather than a manually-scheduled per-ticket
// timeline - see lib/Roadmap/Type/types.ts's own comment for why. All the
// actual state/fetch/zoom/pan logic lives in useRoadmapTimelineState,
// shared with the compact RoadmapWidget on the Dashboard.
const RoadmapPage = () => {
  const roadmapState = useRoadmapTimelineState(DEFAULT_WEEKS_VISIBLE);

  useSetModuleTitle('Roadmap');

  return (
    <PageContainer>
      <p className="text-sm font-semibold text-foreground">Roadmap</p>
      <p className="text-xs text-muted-foreground">
        Planned releases across every project, from Version Tracker - click a release to move its date or edit its tickets.
      </p>

      <RoadmapTimeline {...roadmapState} />
    </PageContainer>
  );
};

export default RoadmapPage;
