import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Settings} from 'lucide-react';
import ActionLink from '../../../../components/ui/ActionLink';
import {PageContainer} from '@/components/ui/page-container';
import {Surface} from '@/components/ui/surface';
import useProjectFromRoute from './useProjectFromRoute';
import useGetProjectStatsHook from '@/lib/Project/Stats/useGetProjectStatsHook';
import useListReleasesHook from '@/lib/Release/useListReleasesHook';
import useListAuditLogHook from '@/lib/AuditLog/useListAuditLogHook';
import TicketDistributionChart from './Overview/TicketDistributionChart';
import EstimateVsLoggedChart from './Overview/EstimateVsLoggedChart';
import TicketsTrendChart from './Overview/TicketsTrendChart';
import ReleaseProgressList from './Overview/ReleaseProgressList';
import RecentActivityFeed from './Overview/RecentActivityFeed';
import {PRIORITIES} from '@/lib/Ticket/Type/types';
import type {ProjectStats} from '@/lib/Project/Stats/Type/types';
import type {Release} from '@/lib/Release/Type/types';
import type {AuditLogEntry} from '@/lib/AuditLog/Type/types';
import type {Project} from '@/lib/Project/Type/types';
import type {AdvancedSearchFilters} from '@/lib/Search/Type/types';
import {DEFAULT_ADVANCED_SEARCH_FILTERS} from '@/lib/Search/defaultAdvancedSearchFilters';
import {toTicketsListQuery} from '@/lib/Ticket/ticketsListSearch';

// `to` null = nothing to link to (see heroStatLinks) - a plain tile then.
const HeroStat = ({label, value, to, className}: {label: string; value: number; to: string | null; className?: string}) => {
  const tile = (
    <Surface className="flex h-full flex-col gap-1 px-4 py-3 transition-colors group-hover:border-accent/40 group-hover:bg-white/[0.06]">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-3xl font-semibold ${className ?? 'text-foreground'}`}>{value.toLocaleString()}</span>
    </Surface>
  );

  return to ? (
    <Link to={to} className="group rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      {tile}
    </Link>
  ) : (
    tile
  );
};

// The Tickets page with its search pre-set (same ?query encoding the page
// writes for itself, see ticketsListSearch) - each hero tile opens exactly
// the tickets it counts. The counts cover every ticket in the project, not
// just roots (see GetProjectStats), which is what a search returns too, so
// the list's "x of y" matches the tile.
const ticketsSearchPath = (projectId: string, filters: Partial<AdvancedSearchFilters> = {}): string => {
  const query = new URLSearchParams(toTicketsListQuery({...DEFAULT_ADVANCED_SEARCH_FILTERS, ...filters})).toString();
  return `/projects/${projectId}/tickets${query ? `?${query}` : ''}`;
};

// Done/Open = the project's done/not-done statuses (the stats count
// status.is_done); Flagged = any flag at all (flags filter is OR-ed, the
// stats count "has at least one flag"). An empty id list would mean "no
// filter" - the whole list behind a tile that says 0 - so such a tile gets
// no link instead (e.g. a project without any flags defined).
const heroStatLinks = (project: Project) => {
  const doneIds = project.statuses.filter((status) => status.isDone).map((status) => status.id);
  const openIds = project.statuses.filter((status) => !status.isDone).map((status) => status.id);
  const flagIds = project.flags.map((flag) => flag.id);

  return {
    tickets: `/projects/${project.id}/tickets`,
    done: doneIds.length > 0 ? ticketsSearchPath(project.id, {statusIds: doneIds}) : null,
    open: openIds.length > 0 ? ticketsSearchPath(project.id, {statusIds: openIds}) : null,
    flagged: flagIds.length > 0 ? ticketsSearchPath(project.id, {flagIds}) : null,
  };
};

const ProjectOverview = () => {
  const {project, state} = useProjectFromRoute();
  const {getProjectStats} = useGetProjectStatsHook();
  const {listReleases} = useListReleasesHook();
  const {listAuditLog} = useListAuditLogHook();

  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [releases, setReleases] = useState<Release[] | null>(null);
  const [activity, setActivity] = useState<AuditLogEntry[] | null>(null);

  useEffect(() => {
    if (!project) {
      return;
    }

    let cancelled = false;

    // One backend-aggregated call, not a client-side loop over every
    // ticket - see ProjectStats' own comment for why (10,000+ tickets would
    // make the old pagination-loop approach both slow and, past its
    // backstop page count, silently inaccurate).
    getProjectStats(project.id).then((result) => {
      if (!cancelled && result.success) {
        setStats(result.stats);
      }
    });

    listReleases(project.id, 0, 5).then((result) => {
      if (!cancelled && result.success) {
        setReleases(result.releases);
      }
    });

    listAuditLog(project.id, {}, 0, 8).then((result) => {
      if (!cancelled && result.success) {
        setActivity(result.entries);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot fetch on project change, getProjectStats/listReleases/listAuditLog are thin useRequestHook wrappers recreated every render
  }, [project?.id]);

  if (state === 'loading') {
    return <div className="p-8 text-sm text-muted-foreground">Loading project…</div>;
  }

  if (state === 'error' || !project) {
    return <div className="p-8 text-sm text-muted-foreground">Couldn't load this project.</div>;
  }

  const links = heroStatLinks(project);
  const statusCountById = new Map(stats?.byStatus.map((entry) => [entry.statusId, entry.count]) ?? []);
  const issueTypeCountById = new Map(stats?.byIssueType.map((entry) => [entry.issueTypeId, entry.count]) ?? []);
  const priorityCountByLevel = new Map(stats?.byPriority.map((entry) => [entry.priority, entry.count]) ?? []);

  const statusBars = project.statuses.map((status) => ({
    key: status.id,
    label: status.name,
    color: status.color,
    count: statusCountById.get(status.id) ?? 0,
  }));

  const issueTypeBars = project.issueTypes.map((issueType) => ({
    key: issueType.id,
    label: issueType.name,
    color: issueType.color,
    count: issueTypeCountById.get(issueType.id) ?? 0,
  }));

  const priorityBars = PRIORITIES.map((priority) => ({
    key: String(priority.level),
    label: priority.name,
    color: priority.color,
    count: priorityCountByLevel.get(priority.level) ?? 0,
  }));

  return (
    <PageContainer>
      <div>
        <p className="text-2xl font-semibold text-foreground">{project.name}</p>
      </div>

      {/* Everything below scrolls on its own, inside WorkPlace's h-full
          dashed-border box - this page is the tallest in the app (six
          stacked chart cards), so without this it grows past the box's
          fixed height instead of scrolling within it. */}
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
        {project.issueTypes.length === 0 && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-amber-400/40 bg-amber-400/5 p-4 text-sm text-amber-200">
            <span>Configure ticket types to get started — this project has no issue types yet.</span>
            <ActionLink
              to={`/projects/${project.id}/settings`}
              className="shrink-0 border-amber-400/40 bg-amber-400/10 text-amber-200 hover:border-amber-400/70 hover:bg-amber-400/20"
            >
              <Settings className="h-4 w-4" />
              Project settings
            </ActionLink>
          </div>
        )}

        {stats === null ? (
          <p className="text-sm text-muted-foreground">Loading stats…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <HeroStat label="Tickets" value={stats.ticketsTotal} to={links.tickets} />
              <HeroStat label="Done" value={stats.ticketsDone} to={links.done} className="text-emerald-400" />
              <HeroStat label="Open" value={stats.ticketsTotal - stats.ticketsDone} to={links.open} className="text-cyan-400" />
              <HeroStat
                label="Flagged"
                value={stats.ticketsFlagged}
                to={links.flagged}
                className={stats.ticketsFlagged > 0 ? 'text-amber-400' : undefined}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Surface className="p-4">
                <TicketDistributionChart title="By status" bars={statusBars} />
              </Surface>
              <Surface className="p-4">
                <TicketDistributionChart title="By issue type" bars={issueTypeBars} />
              </Surface>
              <Surface className="p-4">
                <TicketDistributionChart title="By priority" bars={priorityBars} />
              </Surface>
              <Surface className="p-4">
                <EstimateVsLoggedChart
                  estimateUnit={project.estimateUnit}
                  estimated={stats.estimateTotal}
                  loggedHours={stats.loggedMinutesTotal / 60}
                />
              </Surface>
            </div>

            <Surface className="p-4">
              <TicketsTrendChart created={stats.createdPerWeek} done={stats.donePerWeek} />
            </Surface>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Surface className="p-4">
                <ReleaseProgressList projectId={project.id} releases={releases ?? []} statuses={project.statuses} />
              </Surface>
              <Surface className="p-4">
                <RecentActivityFeed projectId={project.id} entries={activity ?? []} />
              </Surface>
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
};

export default ProjectOverview;
