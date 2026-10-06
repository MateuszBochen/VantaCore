import {Plus} from 'lucide-react';
import ActionLink from '../../../components/ui/ActionLink';
import type {MenuLevel} from '../../../components/PrismMenu';
import type {Project, ProjectSummary} from '../../../lib/Project/Type/types';
import type {BoardSummary} from '../../../lib/Board/Type/types';
import type {Sprint} from '../../../lib/Sprint/Type/types';

// Closed sprints are done - only future/active ones are useful to jump to
// from the sidebar (still reachable from BoardPage's full list). Active
// sprint(s) first among what's left, everything else keeps its original
// (chronological) order - Array.prototype.sort is stable (ES2019+), so this
// never reshuffles non-active sprints relative to each other.
const sortSprintsActiveFirst = (sprints: Sprint[]): Sprint[] =>
  sprints.filter((sprint) => sprint.status !== 'closed').sort((a, b) => Number(b.status === 'active') - Number(a.status === 'active'));

// `activeProject` is the currently-open project's full data (if loaded) - see
// Sidebar.tsx. Only that project's Documentation submenu can show a real
// sub-project list without an extra fetch per project in the sidebar; every
// other project shows none until you actually open it.
//
// `prefetchProject` fires as soon as a project is picked from the list -
// selecting it only drills the menu into its Settings/Documentation tabs
// without navigating anywhere (see PrismMenu's goDeeper), so without this
// the actual project fetch wouldn't start until a leaf route is reached.
export const buildSidebarMenu = (
  projects: ProjectSummary[],
  activeProject: Project | null,
  prefetchProject: (id: string) => void,
  boards: BoardSummary[],
  // Only the currently-open board's sprint list is ever fetched (same
  // lazy-load convention as activeProject/subProjects above) - every other
  // board falls back to a single generic "Sprints" link until you actually
  // open it.
  activeBoardId: string | null,
  activeBoardSprints: Sprint[],
  prefetchBoardSprints: (id: string) => void,
): MenuLevel => ({
  items: [
    {
      label: 'Sprints',
      link: '/sprints',
      subMenu: {
        items: boards.map((board) => {
          const visibleSprints = board.id === activeBoardId ? sortSprintsActiveFirst(activeBoardSprints) : [];
          const sprintItems =
            board.id === activeBoardId
              ? visibleSprints.map((sprint) => ({
                  label: sprint.name,
                  link: `/sprints/${board.id}/sprints/${sprint.id}`,
                }))
              : [{label: 'Sprints', link: `/sprints/${board.id}`}];

          return {
            label: board.name,
            link: `/sprints/${board.id}`,
            onClick: () => prefetchBoardSprints(board.id),
            subMenu: {
              items: [...sprintItems, {label: 'Settings', link: `/sprints/${board.id}/settings`}],
              content:
                board.id === activeBoardId && visibleSprints.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">No sprints yet.</p>
                ) : undefined,
              footer: (
                <ActionLink to={`/sprints/${board.id}/sprints/new`}>
                  <Plus className="h-4 w-4" />
                  Add new sprint
                </ActionLink>
              ),
            },
          };
        }),
        content: boards.length === 0 ? <p className="px-3 py-2 text-xs text-muted-foreground">No boards yet.</p> : undefined,
        footer: (
          <ActionLink to="/sprints/new">
            <Plus className="h-4 w-4" />
            Add new board
          </ActionLink>
        ),
      },
    },
    {
      label: 'Projects',
      link: '/projects',
      subMenu: {
        items: projects.map((project) => {
          const subProjects = project.id === activeProject?.id ? activeProject.subProjects : [];

          return {
            label: project.name,
            link: `/projects/${project.id}`,
            onClick: () => prefetchProject(project.id),
            subMenu: {
              items: [
                {label: 'Tickets', link: `/projects/${project.id}/tickets`},
                {label: 'Ask AI', link: `/projects/${project.id}/documentation/ask-ai`},
                {label: 'Audit Log', link: `/projects/${project.id}/audit-log`},
                {
                  label: 'Documentation',
                  link: `/projects/${project.id}/documentation`,
                  subMenu: {
                    items: [
                      {label: 'Platform Documentation', link: `/projects/${project.id}/documentation/platform`},
                      ...subProjects.map((subProject) => ({
                        label: subProject.name,
                        link: `/projects/${project.id}/documentation/sub-projects/${subProject.id}`,
                      })),
                    ],
                    content: subProjects.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-muted-foreground">No sub-projects yet.</p>
                    ) : undefined,
                    footer: (
                      <ActionLink to={`/projects/${project.id}/documentation/sub-projects/new`}>
                        <Plus className="h-4 w-4" />
                        New sub-project
                      </ActionLink>
                    ),
                  },
                },
                {label: 'Version Tracker', link: `/projects/${project.id}/version-tracker`},
                {label: 'Settings', link: `/projects/${project.id}/settings`},
              ],
              footer: (
                <ActionLink to={`/projects/${project.id}/tickets/new`}>
                  <Plus className="h-4 w-4" />
                  Create new ticket
                </ActionLink>
              ),
            },
          };
        }),
        content: projects.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">No projects yet.</p>
        ) : undefined,
      },
    },
    {label: 'My tickets', link: '/my-tickets'},
    {label: 'My worklog', link: '/my-worklog'},
    {label: 'Roadmap', link: '/roadmap'},
  ],
  footer: (
    <ActionLink to="/projects/new">
      <Plus className="h-4 w-4" />
      Create new project
    </ActionLink>
  ),
});
