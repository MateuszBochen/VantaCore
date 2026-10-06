import {useCallback, useEffect, useState} from 'react';
import {useLocation} from 'react-router-dom';
import {buildSidebarMenu} from './menu';
import {eventBus} from '../../../lib/EventBus/EventBus';
import {ProjectWasCreatedEvent} from '../../../lib/Project/Event/ProjectWasCreatedEvent';
import {ProjectWasSavedEvent} from '../../../lib/Project/Event/ProjectWasSavedEvent';
import {BoardWasCreatedEvent} from '../../../lib/Board/Event/BoardWasCreatedEvent';
import {SprintWasStartedEvent} from '../../../lib/Sprint/Event/SprintWasStartedEvent';
import {SprintWasClosedEvent} from '../../../lib/Sprint/Event/SprintWasClosedEvent';
import useListProjectsHook from '../../../lib/Project/useListProjectsHook';
import useGetProjectHook from '../../../lib/Project/useGetProjectHook';
import useListBoardsHook from '../../../lib/Board/useListBoardsHook';
import useListSprintsHook from '../../../lib/Sprint/useListSprintsHook';
import type {Project, ProjectSummary} from '../../../lib/Project/Type/types';
import type {BoardSummary} from '../../../lib/Board/Type/types';
import type {Sprint} from '../../../lib/Sprint/Type/types';
import type {MenuLevel} from '../../../components/PrismMenu';

// Matches the project id out of any /projects/:id/... route, but not the
// literal "new" segment (that's the create-project redirect, not a real id).
const ACTIVE_PROJECT_PATTERN = /^\/projects\/(?!new(?:\/|$))([^/]+)/;

// Same idea for boards - matches the board id out of any /sprints/:id/...
// route, but not the literal "new" segment (create-board redirect).
const ACTIVE_BOARD_PATTERN = /^\/sprints\/(?!new(?:\/|$))([^/]+)/;

// Builds the PrismMenu tree Sidebar renders - hoisted out of Sidebar.tsx
// (2026-08-11, alongside the Breadcrumb feature) so Panel.tsx can compute it
// ONCE and hand the same tree to both Sidebar (rendering) and
// WorkPlaceHeader's breadcrumb (reading, via BreadcrumbProvider) - as
// siblings under Panel, WorkPlace had no way to reach Sidebar's own local
// state, and duplicating every list/prefetch fetch just for a breadcrumb
// wasn't worth it.
export const useSidebarMenu = (): MenuLevel => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [activeBoardSprints, setActiveBoardSprints] = useState<Sprint[]>([]);
  const {listProjects} = useListProjectsHook();
  const {getProject} = useGetProjectHook();
  const {listBoards} = useListBoardsHook();
  const {listSprints} = useListSprintsHook();
  const location = useLocation();

  // Populate the menu once on load; every project created afterwards during
  // this session is appended live via ProjectWasCreatedEvent below instead of
  // re-fetching the whole list.
  useEffect(() => {
    let cancelled = false;

    listProjects().then((result) => {
      if (!cancelled && result.success) {
        setProjects(result.projects);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listProjects is recreated every render (thin useRequestHook wrapper), including it here would refetch in a loop
  }, []);

  // Same one-time-load convention as the project list above.
  useEffect(() => {
    let cancelled = false;

    listBoards().then((result) => {
      if (!cancelled && result.success) {
        setBoards(result.boards);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listBoards is recreated every render (thin useRequestHook wrapper), including it here would refetch in a loop
  }, []);

  useEffect(() => {
    const handleProjectCreated = (event: ProjectWasCreatedEvent) => {
      setProjects((current) => [...current, event.project]);
    };

    eventBus.subscribe<ProjectWasCreatedEvent>(ProjectWasCreatedEvent.name, handleProjectCreated);

    return () => {
      eventBus.unsubscribe<ProjectWasCreatedEvent>(ProjectWasCreatedEvent.name, handleProjectCreated);
    };
  }, []);

  useEffect(() => {
    const handleBoardCreated = (event: BoardWasCreatedEvent) => {
      setBoards((current) => [...current, {id: event.board.id, name: event.board.name}]);
    };

    eventBus.subscribe<BoardWasCreatedEvent>(BoardWasCreatedEvent.name, handleBoardCreated);

    return () => {
      eventBus.unsubscribe<BoardWasCreatedEvent>(BoardWasCreatedEvent.name, handleBoardCreated);
    };
  }, []);

  // useSaveProjectHook only updates projectCache on save (see its own code) -
  // the sidebar's menu labels come from `projects` (ProjectSummary[]), which
  // was otherwise only ever populated once on mount and appended to on
  // creation, never refreshed on edit (e.g. renaming a project via Settings
  // left the sidebar/breadcrumb showing the old name until a full reload).
  // ProjectWasSavedEvent doesn't carry the project (it's shared with the two
  // documentation-save hooks too, which don't rename anything), so re-derive
  // from the route instead - getProject is cache-backed, so this is a no-op
  // fetch on the (more common) doc-save case where the name didn't change.
  useEffect(() => {
    const handleProjectSaved = () => {
      const projectId = location.pathname.match(ACTIVE_PROJECT_PATTERN)?.[1];

      if (!projectId) {
        return;
      }

      getProject(projectId).then((result) => {
        if (result.success) {
          setActiveProject(result.project);
          setProjects((current) => current.map((project) => (project.id === projectId ? {...project, name: result.project.name} : project)));
        }
      });
    };

    eventBus.subscribe<ProjectWasSavedEvent>(ProjectWasSavedEvent.name, handleProjectSaved);

    return () => {
      eventBus.unsubscribe<ProjectWasSavedEvent>(ProjectWasSavedEvent.name, handleProjectSaved);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getProject is recreated every render (thin useRequestHook wrapper); location.pathname is read fresh via the closure re-subscribing on navigation
  }, [location.pathname]);

  // Re-derive from the cache-backed getProject on every path change (not just
  // when the project id itself changes) so e.g. a freshly-created sub-project
  // shows up right after SubProjectDocumentationPage saves and navigates -
  // full project data is only ever fetched for whichever project is
  // currently open, never for every project in the list.
  useEffect(() => {
    const projectId = location.pathname.match(ACTIVE_PROJECT_PATTERN)?.[1];
    let cancelled = false;

    const resolved = projectId
      ? getProject(projectId).then((result) => (result.success ? result.project : null))
      : Promise.resolve(null);

    resolved.then((project) => {
      if (!cancelled) {
        setActiveProject(project);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getProject is recreated every render (thin useRequestHook wrapper), including it here would refetch in a loop
  }, [location.pathname]);

  // Selecting a project in the sidebar menu only drills it into its
  // Settings/Documentation tabs without navigating anywhere (see PrismMenu's
  // goDeeper), so without this the menu content that depends on activeProject
  // (the sub-project list) would never refresh until a leaf route is reached.
  const prefetchProject = useCallback((id: string) => {
    getProject(id).then((result) => {
      if (result.success) {
        setActiveProject(result.project);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getProject is recreated every render (thin useRequestHook wrapper), including it here would refetch in a loop
  }, []);

  // Same idea for boards - re-derive from the current path on every change so
  // e.g. creating a sprint (which navigates back to /sprints/{boardId}) picks
  // it up automatically. Only the currently-open board's sprint list is ever
  // fetched (see menu.tsx's activeBoardId/activeBoardSprints).
  useEffect(() => {
    const boardId = location.pathname.match(ACTIVE_BOARD_PATTERN)?.[1] ?? null;

    if (!boardId) {
      setActiveBoardId(null);
      setActiveBoardSprints([]);
      return;
    }

    let cancelled = false;

    setActiveBoardId(boardId);

    listSprints(boardId).then((result) => {
      if (!cancelled && result.success) {
        setActiveBoardSprints(result.sprints);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listSprints is recreated every render (thin useRequestHook wrapper), including it here would refetch in a loop
  }, [location.pathname]);

  // Same idea as prefetchProject - selecting a board in the sidebar only
  // drills into its Sprints/Settings tabs without navigating (see PrismMenu's
  // goDeeper), so without this the sprint list wouldn't load until a leaf
  // route is reached.
  const prefetchBoardSprints = useCallback((id: string) => {
    setActiveBoardId(id);

    listSprints(id).then((result) => {
      if (result.success) {
        setActiveBoardSprints(result.sprints);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listSprints is recreated every render (thin useRequestHook wrapper), including it here would refetch in a loop
  }, []);

  // Starting/closing a sprint (BoardPage's Start/Close buttons) doesn't
  // navigate, so the route-based effect above wouldn't otherwise pick up the
  // status change that determines sort order (active sprint on top).
  useEffect(() => {
    const handleSprintStatusChanged = () => {
      if (!activeBoardId) {
        return;
      }

      listSprints(activeBoardId).then((result) => {
        if (result.success) {
          setActiveBoardSprints(result.sprints);
        }
      });
    };

    eventBus.subscribe<SprintWasStartedEvent>(SprintWasStartedEvent.name, handleSprintStatusChanged);
    eventBus.subscribe<SprintWasClosedEvent>(SprintWasClosedEvent.name, handleSprintStatusChanged);

    return () => {
      eventBus.unsubscribe<SprintWasStartedEvent>(SprintWasStartedEvent.name, handleSprintStatusChanged);
      eventBus.unsubscribe<SprintWasClosedEvent>(SprintWasClosedEvent.name, handleSprintStatusChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listSprints is recreated every render (thin useRequestHook wrapper)
  }, [activeBoardId]);

  return buildSidebarMenu(projects, activeProject, prefetchProject, boards, activeBoardId, activeBoardSprints, prefetchBoardSprints);
};
