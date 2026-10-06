import {useEffect, useState} from 'react';
import {Input} from '@/components/ui/input';
import {Select} from '@/components/ui/select';
import {Combobox} from '@/components/ui/combobox';
import {Checkbox} from '@/components/ui/checkbox';
import {DateInput} from '@/components/ui/date-input';
import {ChipInput} from '@/components/ui/chip-input';
import {PillButton} from '@/components/ui/pill-button';
import {TriStateSwitch} from '@/components/ui/tri-state-switch';
import {Button} from '@/components/ui/button';
import {InfoPopover} from '@/components/ui/info-popover';
import useListProjectsHook from '@/lib/Project/useListProjectsHook';
import useGetProjectHook from '@/lib/Project/useGetProjectHook';
import useGetTicketTagsHook from '@/lib/Ticket/useGetTicketTagsHook';
import useUsersHook from '@/lib/User/useUsersHook';
import getUserDisplayName from '@/lib/User/getUserDisplayName';
import {PRIORITIES} from '@/lib/Ticket/Type/types';
import type {IssueStatus, Project, ProjectSummary} from '@/lib/Project/Type/types';
import type {AdvancedSearchFilters as Filters, SearchResultType} from '@/lib/Search/Type/types';

type AdvancedSearchFiltersProps = {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onSubmit: () => void;
  loading: boolean;
  // When set, that section's editable UI (pills / project combobox) isn't
  // rendered at all - the host is responsible for seeding filters.types/
  // filters.projectIds to the locked value up front and never changing it,
  // since there's no control left that could. Used by SprintTicketPicker to
  // pin this to "tickets only, from this board's own projects" rather than
  // exposing the "whole app" picker that makes sense on the standalone page.
  lockedTypes?: SearchResultType[];
  lockedProjectIds?: string[];
};

const TYPE_OPTIONS: {value: SearchResultType; label: string}[] = [
  {value: 'project', label: 'Projects'},
  {value: 'subProject', label: 'Sub-projects'},
  {value: 'ticket', label: 'Tickets'},
  {value: 'testCase', label: 'Test cases'},
];

const toggle = <T,>(list: T[], value: T): T[] => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

// Issue type/Status/Flags/CustomFields are all defined per-Project (Project.issueTypes,
// Project.statuses, Project.flags, Project.customFieldDefinitions) - there's no
// cross-project schema to show a meaningful combined picker, so these four sections only
// render once exactly one project is selected ("only render a facet if there's something
// to filter by"). Priority is a fixed app-wide enum and Tags have a per-project
// vocabulary merged across the selected projects, so both stay available at any scope.
// Mirrors the Api's search semantics (JpaSearchRepositoryAdapter: 'simple'
// full-text config, every word AND-ed, last word a prefix match; one facet's
// values OR-ed, facets AND-ed) and TicketTree's result rendering - keep in
// sync if either changes.
const SearchHelp = () => (
  <div className="flex flex-col gap-3">
    <div className="flex flex-col gap-1">
      <p className="font-semibold">Query</p>
      <ul className="list-disc space-y-0.5 pl-4 text-muted-foreground">
        <li>Matches whole words, case-insensitive. Every word must match; the last one can be just the beginning of a word ("vanta co" finds "Vanta Core").</li>
        <li>It doesn't match inside a word: "core" won't find "vantacore".</li>
        <li>Tickets are searched by key, title, description and custom field values; projects and sub-projects by name; test cases by title.</li>
        <li>With a query, best matches come first; without one, the most recently updated.</li>
      </ul>
    </div>

    <div className="flex flex-col gap-1">
      <p className="font-semibold">Filters</p>
      <ul className="list-disc space-y-0.5 pl-4 text-muted-foreground">
        <li>Different sections must all match (AND). Several values within one section mean any of them (OR), e.g. two statuses.</li>
        <li>Date ranges include both whole days.</li>
      </ul>
    </div>

    <div className="flex flex-col gap-1">
      <p className="font-semibold">Ticket results</p>
      <ul className="list-disc space-y-0.5 pl-4 text-muted-foreground">
        <li>Shown as a tree: a match whose parent also matched is nested under it instead of listed twice.</li>
        <li>Expanding a row loads all of its sub-tickets. Dimmed ones don't match your filters; they're shown only for context.</li>
      </ul>
    </div>
  </div>
);

const AdvancedSearchFilters = ({filters, onChange, onSubmit, loading, lockedTypes, lockedProjectIds}: AdvancedSearchFiltersProps) => {
  const {listProjects} = useListProjectsHook();
  const {getProject} = useGetProjectHook();
  const {users} = useUsersHook();
  const {getTicketTags} = useGetTicketTagsHook();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [singleProject, setSingleProject] = useState<Project | null>(null);

  useEffect(() => {
    if (lockedProjectIds) {
      return;
    }

    listProjects().then((result) => {
      if (result.success) {
        setProjects(result.projects);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listProjects is a thin useRequestHook wrapper recreated every render; lockedProjectIds is a host-fixed prop, not expected to toggle mid-lifetime
  }, [lockedProjectIds]);

  const singleProjectId = filters.projectIds.length === 1 ? filters.projectIds[0] : null;

  // Tag autocomplete, same per-project vocabulary TicketFieldsSidebar's Tags
  // field suggests from - there's no cross-project tags endpoint, so this is
  // the union over the selected projects, or over every project when none is
  // picked (the standalone page's "whole app" scope). Joined into a string
  // key since the id arrays aren't referentially stable across renders.
  const tagScopeKey = (filters.projectIds.length > 0 ? filters.projectIds : projects.map((project) => project.id)).join(',');
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const projectIds = tagScopeKey ? tagScopeKey.split(',') : [];
    let cancelled = false;

    Promise.all(projectIds.map((id) => getTicketTags(id))).then((results) => {
      if (!cancelled) {
        const tags = new Set(results.flatMap((result) => (result.success ? result.tags : [])));
        setTagSuggestions(Array.from(tags).sort((a, b) => a.localeCompare(b)));
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getTicketTags is a thin useRequestHook wrapper recreated every render
  }, [tagScopeKey]);

  // Clearing the stale project (when the selection stops being exactly one
  // project) is a pure derivation of singleProjectId, done during render via
  // the state-vs-state comparison convention (same as GlobalSearch.tsx's
  // query-change reset) rather than a synchronous setState inside the effect
  // below - the effect itself only ever calls setState from its async
  // getProject().then(), which is the legitimate "subscribe to an external
  // system" case react-hooks/set-state-in-effect allows.
  const [loadedProjectId, setLoadedProjectId] = useState(singleProjectId);
  if (loadedProjectId !== singleProjectId) {
    setLoadedProjectId(singleProjectId);
    if (singleProject !== null) {
      setSingleProject(null);
    }
  }

  useEffect(() => {
    if (!singleProjectId) {
      return;
    }

    let cancelled = false;

    getProject(singleProjectId).then((result) => {
      if (!cancelled && result.success) {
        setSingleProject(result.project);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getProject is a thin useRequestHook wrapper recreated every render
  }, [singleProjectId]);

  const statuses: IssueStatus[] = singleProject?.statuses ?? [];

  return (
    // min-h-0 overrides the flex item's default min-height:auto - without it,
    // this panel (itself a flex container) refuses to shrink below its own
    // content height even though the parent row stretches it, which silently
    // defeats overflow-y-auto and lets content spill past the rounded border
    // instead of scrolling.
    <div className="flex min-h-0 w-80 shrink-0 flex-col gap-5 overflow-y-auto rounded-xl border border-border bg-card p-4">
      <div className="flex shrink-0 flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Query</p>
          <InfoPopover label="How search works">
            <SearchHelp />
          </InfoPopover>
        </div>
        <Input value={filters.q} onChange={(e) => onChange({q: e.target.value})} placeholder="Search…" />
      </div>

      {!lockedTypes && (
        <div className="flex shrink-0 flex-col gap-1.5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Object type</p>
          <div className="flex flex-wrap gap-1.5">
            {TYPE_OPTIONS.map((option) => (
              <PillButton key={option.value} selected={filters.types.includes(option.value)} onClick={() => onChange({types: toggle(filters.types, option.value)})}>
                {option.label}
              </PillButton>
            ))}
          </div>
        </div>
      )}

      {!lockedProjectIds && (
        <div className="flex shrink-0 flex-col gap-1.5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Projects</p>
          <Combobox
            multiple
            value={filters.projectIds}
            onValueChange={(projectIds) => {
              // Issue type/status/flag/custom-field filters are ids from the
              // ONE selected project's catalog - once that project changes
              // (another one, several, or none) they'd point at nothing the
              // panel shows, yet still be sent and quietly empty the results.
              // Tags are free text, so they survive.
              const nextSingleProjectId = projectIds.length === 1 ? projectIds[0] : null;
              onChange(
                nextSingleProjectId === singleProjectId
                  ? {projectIds}
                  : {projectIds, issueTypeIds: [], statusIds: [], flagIds: [], customFields: {}},
              );
            }}
            placeholder="Whole app…"
            options={projects.map((project) => ({value: project.id, label: project.name}))}
          />
        </div>
      )}

      <div className="flex shrink-0 flex-col gap-1.5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Priority</p>
        <div className="flex flex-wrap gap-1.5">
          {PRIORITIES.map((priority) => (
            <PillButton
              key={priority.level}
              selected={filters.priorities.includes(priority.level)}
              color={priority.color}
              onClick={() => onChange({priorities: toggle(filters.priorities, priority.level)})}
            >
              {priority.name}
            </PillButton>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-1.5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Tags</p>
        <ChipInput
          values={filters.tags}
          onChange={(tags) => onChange({tags})}
          placeholder="Add a tag, Enter or Space to confirm…"
          suggestions={tagSuggestions}
        />
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Has estimation</p>
        <TriStateSwitch value={filters.hasEstimation} onChange={(hasEstimation) => onChange({hasEstimation})} />
      </div>

      {filters.projectIds.length !== 1 ? (
        <p className="shrink-0 text-xs text-muted-foreground">Select exactly one project to filter by issue type, status, flags, or custom fields.</p>
      ) : (
        singleProject && (
          <>
            {singleProject.issueTypes.length > 0 && (
              <div className="flex shrink-0 flex-col gap-1.5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Issue type</p>
                <div className="flex flex-wrap gap-1.5">
                  {singleProject.issueTypes.map((issueType) => (
                    <PillButton
                      key={issueType.id}
                      selected={filters.issueTypeIds.includes(issueType.id)}
                      color={issueType.color}
                      onClick={() => onChange({issueTypeIds: toggle(filters.issueTypeIds, issueType.id)})}
                    >
                      {issueType.name}
                    </PillButton>
                  ))}
                </div>
              </div>
            )}

            {statuses.length > 0 && (
              <div className="flex shrink-0 flex-col gap-1.5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Status</p>
                <div className="flex flex-wrap gap-1.5">
                  {statuses.map((status) => (
                    <PillButton
                      key={status.id}
                      selected={filters.statusIds.includes(status.id)}
                      color={status.color}
                      onClick={() => onChange({statusIds: toggle(filters.statusIds, status.id)})}
                    >
                      {status.name}
                    </PillButton>
                  ))}
                </div>
              </div>
            )}

            {singleProject.flags.length > 0 && (
              <div className="flex shrink-0 flex-col gap-1.5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Flags</p>
                <div className="flex flex-wrap gap-1.5">
                  {singleProject.flags.map((flag) => (
                    <PillButton
                      key={flag.id}
                      selected={filters.flagIds.includes(flag.id)}
                      color={flag.color}
                      onClick={() => onChange({flagIds: toggle(filters.flagIds, flag.id)})}
                    >
                      {flag.name}
                    </PillButton>
                  ))}
                </div>
              </div>
            )}

            {singleProject.customFieldDefinitions.length > 0 && (
              <div className="flex shrink-0 flex-col gap-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Custom fields</p>

                {singleProject.customFieldDefinitions.map((field) => {
                  const value = filters.customFields[field.id] ?? '';
                  const setValue = (next: string) => onChange({customFields: {...filters.customFields, [field.id]: next}});

                  if (field.type === 'checkbox') {
                    return (
                      <div key={field.id} className="flex items-center justify-between gap-2">
                        <p className="text-left text-xs text-muted-foreground">{field.name}</p>
                        <Checkbox checked={value === 'true'} onCheckedChange={(checked) => setValue(checked ? 'true' : '')} />
                      </div>
                    );
                  }

                  return (
                    <div key={field.id} className="flex shrink-0 flex-col gap-1.5">
                      <p className="text-left text-xs text-muted-foreground">{field.name}</p>

                      {field.type === 'text' && <Input value={value} onChange={(e) => setValue(e.target.value)} />}
                      {field.type === 'number' && <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />}
                      {(field.type === 'date' || field.type === 'time' || field.type === 'dateTime') && (
                        <DateInput type={field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'datetime-local'} value={value} onChange={setValue} />
                      )}
                      {field.type === 'user' && (
                        <Combobox
                          value={value}
                          onValueChange={setValue}
                          placeholder="Search a user…"
                          options={users.map((user) => ({value: user.id, label: getUserDisplayName(user), avatarUrl: user.avatarUrl}))}
                        />
                      )}
                      {field.type === 'select' && (
                        <Select
                          value={value}
                          onValueChange={setValue}
                          placeholder="Select…"
                          options={(field.options ?? []).filter((option) => option.trim() !== '').map((option) => ({value: option, label: option}))}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )
      )}

      <div className="flex shrink-0 flex-col gap-1.5 border-t border-border pt-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Created</p>
        <div className="flex items-center gap-2">
          <DateInput value={filters.createdFrom ?? ''} onChange={(v) => onChange({createdFrom: v || null})} placeholder="From" />
          <DateInput value={filters.createdTo ?? ''} onChange={(v) => onChange({createdTo: v || null})} placeholder="To" />
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-1.5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Updated</p>
        <div className="flex items-center gap-2">
          <DateInput value={filters.updatedFrom ?? ''} onChange={(v) => onChange({updatedFrom: v || null})} placeholder="From" />
          <DateInput value={filters.updatedTo ?? ''} onChange={(v) => onChange({updatedTo: v || null})} placeholder="To" />
        </div>
      </div>

      <Button onClick={onSubmit} disabled={loading} className="shrink-0">
        {loading ? 'Searching…' : 'Search'}
      </Button>
    </div>
  );
};

export default AdvancedSearchFilters;
