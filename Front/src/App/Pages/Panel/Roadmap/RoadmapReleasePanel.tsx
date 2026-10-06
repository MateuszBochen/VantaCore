import {useEffect, useState} from 'react';
import {Check} from 'lucide-react';
import {Link} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {DateInput} from '@/components/ui/date-input';
import ReleaseTicketPicker from '../Project/VersionTracker/ReleaseTicketPicker';
import useSaveReleaseHook from '@/lib/Release/useSaveReleaseHook';
import type {RoadmapRelease, RoadmapReleaseTicket} from '@/lib/Roadmap/Type/types';

type RoadmapReleasePanelProps = {
  release: RoadmapRelease;
  onSaved: (release: RoadmapRelease) => void;
};

// Opens inline, pushed into the row below the bar that was clicked (see
// RoadmapTimeline, which also positions this under that exact bar) - not a
// popover. A hover popover can't host a search input or a date field (the
// pointer leaving the bar to reach them would close it), which is exactly
// what moving a release's date/tickets from here needs.
const RoadmapReleasePanel = ({release, onSaved}: RoadmapReleasePanelProps) => {
  const {saveRelease} = useSaveReleaseHook();

  const [ticketIds, setTicketIds] = useState<string[]>(release.tickets.map((ticket) => ticket.id));
  const [plannedReleaseDate, setPlannedReleaseDate] = useState(release.plannedReleaseDate);
  const [saving, setSaving] = useState(false);
  // Starts "collapsed" (scaled down, translated up toward the bar, faded
  // out) and flips to its resting state one frame after mount - a CSS
  // transition can't animate a mount from nothing, it needs to actually
  // render the "before" state for a frame first. transform-origin: top left
  // anchors the grow to the bar's own corner, so this reads as growing OUT
  // of the bar rather than just appearing.
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const canSave = plannedReleaseDate !== '';

  const handleSave = () => {
    setSaving(true);

    saveRelease(release.projectId, release.id, {
      plannedReleaseDate,
      afterCarePeriod: release.afterCarePeriod,
      status: release.status,
      versionNumber: release.versionNumber,
      name: release.name,
      ticketIds,
    })
      .then((result) => {
        if (result.success) {
          const tickets: RoadmapReleaseTicket[] = ticketIds.map((id) => {
            const existing = release.tickets.find((ticket) => ticket.id === id);
            return {id, statusId: existing?.statusId ?? '', key: existing?.key ?? id, title: existing?.title ?? ''};
          });

          onSaved({...release, plannedReleaseDate, tickets});
        }
      })
      .finally(() => setSaving(false));
  };

  return (
    <div
      className={`flex w-[420px] max-w-full origin-top-left flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-xl transition-all duration-200 ease-out ${
        entered ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-2 scale-95 opacity-0'
      }`}
    >
      <div className="flex items-end gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Planned release date</p>
          <DateInput value={plannedReleaseDate} onChange={setPlannedReleaseDate} />
        </div>

        <Button size="sm" leftIcon={<Check className="h-4 w-4" />} onClick={handleSave} loading={saving} disabled={!canSave}>
          Save
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Tickets{ticketIds.length > 0 ? ` (${ticketIds.length})` : ''}</p>
        <ReleaseTicketPicker projectId={release.projectId} ticketIds={ticketIds} onTicketIdsChange={setTicketIds} initialTicketDetails={release.tickets} />
      </div>

      <Link to={`/projects/${release.projectId}/version-tracker`} className="self-start text-xs text-accent hover:underline">
        Open in Version Tracker
      </Link>
    </div>
  );
};

export default RoadmapReleasePanel;
