import {Link} from 'react-router-dom';
import {getReleaseStatusLabel} from '@/lib/Release/releaseStatuses';
import type {Release} from '@/lib/Release/Type/types';
import type {Status} from '@/lib/Project/Type/types';

type ReleaseProgressListProps = {
  projectId: string;
  releases: Release[];
  statuses: Status[];
};

// Meter-style progress bar per release - fill carries the "how much is
// actually done" signal, unfilled track is a lighter step of the same hue
// (see dataviz skill's Meter contract), not a second color. The track needs
// a visible border/fill of its own (not just a near-invisible /10 tint) -
// at 10% opacity on this dark surface it read as the bar abruptly ending at
// the fill's edge rather than continuing as an unfilled track to 100%
// width, confirmed live on VantaCore's 1.0.0.0 release row.
const ReleaseProgressList = ({projectId, releases, statuses}: ReleaseProgressListProps) => {
  const statusesById = new Map(statuses.map((status) => [status.id, status]));

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Releases</p>

      {releases.length === 0 ? (
        <p className="text-xs text-muted-foreground">No releases planned yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {releases.map((release) => {
            const total = release.tickets.length;
            const done = release.tickets.filter((ticket) => statusesById.get(ticket.statusId)?.isDone).length;
            const percent = total === 0 ? 0 : Math.round((done / total) * 100);

            return (
              <Link
                key={release.id}
                to={`/projects/${projectId}/version-tracker`}
                className="flex flex-col gap-1 rounded-lg border border-border bg-white/[0.03] px-3 py-2 hover:border-accent/30"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">{release.versionNumber}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    {getReleaseStatusLabel(release.status)}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {done}/{total} done
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full border border-accent/20 bg-accent/[0.15]">
                  <div className="h-full rounded-full bg-accent transition-all" style={{width: `${percent}%`}} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReleaseProgressList;
