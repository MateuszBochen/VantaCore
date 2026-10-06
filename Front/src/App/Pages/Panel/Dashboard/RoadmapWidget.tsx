import {Link} from 'react-router-dom';
import RoadmapTimeline from '../Roadmap/RoadmapTimeline';
import useRoadmapTimelineState from '../Roadmap/useRoadmapTimelineState';

// Narrower default window than the full /roadmap page (RoadmapPage uses 16)
// - a dashboard card has less room, and Ctrl+scroll zoom/Prev/Next are still
// right there for widening it.
const DEFAULT_WEEKS_VISIBLE = 8;

// Same RoadmapTimeline the full page uses (zoom, click-to-edit release
// panels, all of it) via the shared useRoadmapTimelineState hook - just
// wrapped as a compact card instead of a full PageContainer, same pattern
// as MyWorklogWidget.
const RoadmapWidget = () => {
  const roadmapState = useRoadmapTimelineState(DEFAULT_WEEKS_VISIBLE);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Roadmap</p>
        <Link to="/roadmap" className="text-xs text-accent hover:underline">
          Open full roadmap
        </Link>
      </div>

      <RoadmapTimeline {...roadmapState} />
    </div>
  );
};

export default RoadmapWidget;
