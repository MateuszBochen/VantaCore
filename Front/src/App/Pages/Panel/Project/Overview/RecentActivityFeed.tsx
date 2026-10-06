import {Link} from 'react-router-dom';
import buildAuditResourceLink from '../AuditLog/buildAuditResourceLink';
import type {AuditAction, AuditLogEntry} from '@/lib/AuditLog/Type/types';

type RecentActivityFeedProps = {
  projectId: string;
  entries: AuditLogEntry[];
};

const ACTION_CLASSES: Record<AuditAction, string> = {
  CREATE: 'text-emerald-400',
  UPDATE: 'text-cyan-400',
  DELETE: 'text-destructive',
};

// Same action/resourceType/actorEmail row shape as AuditLogPage's own list,
// just the newest handful with no filters/expand - "what's been happening"
// at a glance, not the full investigative view (that's still /audit-log).
const RecentActivityFeed = ({projectId, entries}: RecentActivityFeedProps) => (
  <div className="flex flex-col gap-2">
    <p className="text-xs uppercase tracking-widest text-muted-foreground">Recent activity</p>

    {entries.length === 0 ? (
      <p className="text-xs text-muted-foreground">Nothing yet.</p>
    ) : (
      <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {entries.map((entry) => {
          const link = buildAuditResourceLink(projectId, entry);
          const row = (
            <div className="flex items-center gap-2 px-3 py-2 text-xs">
              <span className={`shrink-0 font-semibold ${ACTION_CLASSES[entry.action]}`}>{entry.action}</span>
              <span className="shrink-0 text-muted-foreground">{entry.resourceType}</span>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{entry.actorEmail}</span>
              <span className="shrink-0 text-muted-foreground">{new Date(entry.occurredAt).toLocaleDateString()}</span>
            </div>
          );

          return link ? (
            <Link key={entry.id} to={link} className="hover:bg-muted">
              {row}
            </Link>
          ) : (
            <div key={entry.id}>{row}</div>
          );
        })}
      </div>
    )}
  </div>
);

export default RecentActivityFeed;
