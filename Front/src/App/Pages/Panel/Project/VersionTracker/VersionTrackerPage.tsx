import {useEffect, useState} from 'react';
import {Plus} from 'lucide-react';
import {PageContainer} from '@/components/ui/page-container';
import {Button} from '@/components/ui/button';
import {LoadMoreButton} from '@/components/ui/load-more-button';
import useProjectFromRoute from '../useProjectFromRoute';
import {useSetModuleTitle} from '../../ModuleTitle';
import useListReleasesHook from '@/lib/Release/useListReleasesHook';
import useGetTicketsHook from '@/lib/Ticket/useGetTicketsHook';
import ReleaseCard from './ReleaseCard';
import createDraftRelease from './createDraftRelease';
import type {Release} from '@/lib/Release/Type/types';
import type {TicketSummary} from '@/lib/Ticket/Type/types';

// Backend default, made explicit here (see useListReleasesHook) rather than
// left implicit - also what "Load more" pages by.
const RELEASES_PAGE_LIMIT = 25;

// Unset dates sort last, not first - an undated release is "not scheduled
// yet", the opposite of "coming up soonest".
const sortByPlannedDate = (releases: Release[]): Release[] =>
  releases.slice().sort((a, b) => (a.plannedReleaseDate || '9999-99-99').localeCompare(b.plannedReleaseDate || '9999-99-99'));

// Version/release planning for a project - reached via the sidebar's
// per-project submenu (see Panel/menu.tsx: "Version Tracker", between
// Documentation and Settings). Backed by GET/PUT /api/project/{id}/release
// (confirmed spec 2026-08-16) - see useSaveReleaseHook's own comment for why
// "New version" reuses PUT (upsert) instead of a separate POST.
const VersionTrackerPage = () => {
  const {project, state} = useProjectFromRoute();
  const {listReleases} = useListReleasesHook();
  const {getTickets} = useGetTicketsHook();

  const [releases, setReleases] = useState<Release[] | null>(null);
  const [totalReleases, setTotalReleases] = useState(0);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [ticketOptions, setTicketOptions] = useState<TicketSummary[]>([]);
  const [draft, setDraft] = useState<Release | null>(null);

  useSetModuleTitle(project ? `${project.name} - Version Tracker` : null);

  useEffect(() => {
    if (!project) {
      return;
    }

    let cancelled = false;

    listReleases(project.id, 0, RELEASES_PAGE_LIMIT).then((result) => {
      if (!cancelled) {
        setReleases(result.success ? result.releases : []);
        setTotalReleases(result.success ? result.total : 0);
        setPage(0);
      }
    });

    getTickets(project.id).then((result) => {
      if (!cancelled && result.success) {
        setTicketOptions(result.tickets);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listReleases/getTickets are thin useRequestHook wrappers recreated every render
  }, [project?.id]);

  if (state === 'loading' || !project) {
    return <p className="p-8 text-sm text-muted-foreground">Loading…</p>;
  }

  if (state === 'error') {
    return <p className="p-8 text-sm text-muted-foreground">Couldn't load this project.</p>;
  }

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setLoadingMore(true);

    listReleases(project.id, nextPage, RELEASES_PAGE_LIMIT)
      .then((result) => {
        if (!result.success) {
          return;
        }

        setPage(nextPage);
        setTotalReleases(result.total);
        setReleases((current) => [...(current ?? []), ...result.releases]);
      })
      .finally(() => setLoadingMore(false));
  };

  const handleSaved = (saved: Release, wasNew: boolean) => {
    setReleases((current) => {
      const existing = current ?? [];
      return wasNew ? [...existing, saved] : existing.map((release) => (release.id === saved.id ? saved : release));
    });

    if (wasNew) {
      setDraft(null);
      setTotalReleases((current) => current + 1);
    }
  };

  const hasMore = releases !== null && releases.length < totalReleases;

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Version Tracker</p>

        {!draft && (
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setDraft(createDraftRelease(project.id))}>
            New version
          </Button>
        )}
      </div>

      {draft && (
        <ReleaseCard
          key={draft.id}
          projectId={project.id}
          release={draft}
          ticketOptions={ticketOptions}
          issueTypes={project.issueTypes}
          statuses={project.statuses}
          flags={project.flags}
          isNew
          onSaved={(saved) => handleSaved(saved, true)}
          onCancelNew={() => setDraft(null)}
        />
      )}

      {releases === null ? (
        <p className="text-sm text-muted-foreground">Loading versions…</p>
      ) : releases.length === 0 && !draft ? (
        <p className="text-sm text-muted-foreground">No versions planned yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {sortByPlannedDate(releases).map((release) => (
            <ReleaseCard
              key={release.id}
              projectId={project.id}
              release={release}
              ticketOptions={ticketOptions}
              issueTypes={project.issueTypes}
          statuses={project.statuses}
          flags={project.flags}
              onSaved={(saved) => handleSaved(saved, false)}
            />
          ))}

          {hasMore && (
            <LoadMoreButton loaded={releases?.length ?? 0} total={totalReleases} loading={loadingMore} onClick={handleLoadMore} />
          )}
        </div>
      )}
    </PageContainer>
  );
};

export default VersionTrackerPage;
