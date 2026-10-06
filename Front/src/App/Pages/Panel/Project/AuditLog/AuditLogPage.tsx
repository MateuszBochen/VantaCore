import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {ChevronDown, ChevronRight} from 'lucide-react';
import {PageContainer} from '@/components/ui/page-container';
import {Button} from '@/components/ui/button';
import {LoadMoreButton} from '@/components/ui/load-more-button';
import {Select} from '@/components/ui/select';
import {Combobox} from '@/components/ui/combobox';
import {DateInput} from '@/components/ui/date-input';
import useProjectFromRoute from '../useProjectFromRoute';
import {useSetModuleTitle} from '../../ModuleTitle';
import useUsersHook from '@/lib/User/useUsersHook';
import getUserDisplayName from '@/lib/User/getUserDisplayName';
import useListAuditLogHook from '@/lib/AuditLog/useListAuditLogHook';
import buildAuditResourceLink from './buildAuditResourceLink';
import {formatAuditFieldLabel, formatAuditFieldValue} from './formatAuditDiff';
import {AUDIT_RESOURCE_TYPES} from '@/lib/AuditLog/resourceTypes';
import type {AuditAction, AuditLogEntry, AuditLogFilters} from '@/lib/AuditLog/Type/types';

const LIMIT = 30;

const ACTION_OPTIONS: {value: AuditAction; label: string}[] = [
  {value: 'CREATE', label: 'Create'},
  {value: 'UPDATE', label: 'Update'},
  {value: 'DELETE', label: 'Delete'},
];

const ACTION_CLASSES: Record<AuditAction, string> = {
  CREATE: 'text-emerald-400',
  UPDATE: 'text-cyan-400',
  DELETE: 'text-destructive',
};

const EMPTY_FILTERS: AuditLogFilters = {actorId: '', resourceType: '', action: '', from: '', till: ''};

// Own top-level sidebar entry (see menu.tsx), same tier as Ask AI - this is
// something you browse/investigate, not project configuration, so it
// doesn't belong nested in Settings the way Automation Rules ended up (see
// that feature's own history for why the distinction matters here).
const AuditLogPage = () => {
  const {project, state} = useProjectFromRoute();
  const {users} = useUsersHook();
  const {listAuditLog} = useListAuditLogHook();
  const [filters, setFilters] = useState<AuditLogFilters>(EMPTY_FILTERS);
  const [entries, setEntries] = useState<AuditLogEntry[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useSetModuleTitle(project ? `${project.name} - Audit Log` : null);

  useEffect(() => {
    if (!project) {
      return;
    }

    let cancelled = false;
    setEntries(null);

    listAuditLog(project.id, filters, 0, LIMIT).then((result) => {
      if (!cancelled && result.success) {
        setEntries(result.entries);
        setTotal(result.total);
        setPage(0);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listAuditLog is a thin useRequestHook wrapper recreated every render
  }, [project?.id, filters]);

  const handleLoadMore = () => {
    if (!project) {
      return;
    }

    setLoadingMore(true);

    listAuditLog(project.id, filters, page + 1, LIMIT)
      .then((result) => {
        if (result.success) {
          setEntries((current) => [...(current ?? []), ...result.entries]);
          setPage((current) => current + 1);
        }
      })
      .finally(() => setLoadingMore(false));
  };

  const userOptions = users.map((user) => ({value: user.id, label: getUserDisplayName(user), avatarUrl: user.avatarUrl}));

  if (state === 'loading' || !project) {
    return <div className="p-8 text-sm text-muted-foreground">Loading project…</div>;
  }

  if (state === 'error') {
    return <div className="p-8 text-sm text-muted-foreground">Couldn't load this project.</div>;
  }

  return (
    <PageContainer>
      <p className="text-sm font-semibold text-foreground">Audit Log</p>

      <div className="flex flex-wrap items-center gap-2">
        <Combobox
          className="max-w-56"
          value={filters.actorId}
          onValueChange={(value) => setFilters((current) => ({...current, actorId: value}))}
          options={userOptions}
          placeholder="Actor"
        />
        <Select
          className="max-w-48"
          value={filters.resourceType}
          onValueChange={(value) => setFilters((current) => ({...current, resourceType: value}))}
          options={AUDIT_RESOURCE_TYPES}
          placeholder="Resource type"
        />
        <Select
          className="max-w-40"
          value={filters.action}
          onValueChange={(value) => setFilters((current) => ({...current, action: value as AuditAction | ''}))}
          options={ACTION_OPTIONS}
          placeholder="Action"
        />
        <DateInput
          className="max-w-40"
          value={filters.from}
          onChange={(value) => setFilters((current) => ({...current, from: value}))}
          placeholder="From"
        />
        <DateInput
          className="max-w-40"
          value={filters.till}
          onChange={(value) => setFilters((current) => ({...current, till: value}))}
          placeholder="Till"
        />
        {(filters.actorId || filters.resourceType || filters.action || filters.from || filters.till) && (
          <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)} className="text-muted-foreground">
            Clear filters
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {entries === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matching audit entries.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry) => {
              const link = buildAuditResourceLink(project.id, entry);
              const expanded = expandedId === entry.id;
              const diffFields = Object.entries(entry.diff);

              return (
                <div key={entry.id} className="rounded-xl border border-border bg-card p-3">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : entry.id)}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    {diffFields.length > 0 ? (
                      expanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )
                    ) : (
                      <span className="h-4 w-4 shrink-0" />
                    )}

                    <span className={`shrink-0 text-xs font-semibold ${ACTION_CLASSES[entry.action]}`}>{entry.action}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{entry.resourceType}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">{entry.actorEmail}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{new Date(entry.occurredAt).toLocaleString()}</span>
                  </button>

                  {link && (
                    <Link
                      to={link}
                      onClick={(event) => event.stopPropagation()}
                      className="mt-1 block w-fit pl-7 text-xs text-accent hover:underline"
                    >
                      View {entry.resourceType.toLowerCase()}
                    </Link>
                  )}

                  {expanded && diffFields.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1 border-t border-border pt-2 pl-7">
                      {diffFields.map(([field, change]) => (
                        <p key={field} className="text-xs text-muted-foreground">
                          <span className="text-foreground">{formatAuditFieldLabel(field)}</span>:{' '}
                          {formatAuditFieldValue(project, users, field, change.before)} →{' '}
                          {formatAuditFieldValue(project, users, field, change.after)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {entries.length < total && (
              <LoadMoreButton loaded={entries.length} total={total} loading={loadingMore} onClick={handleLoadMore} />
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default AuditLogPage;
