import {useEffect, useState} from 'react';
import JwtManager from '../Jwt/JwtManager';
import useUsersHook from '../User/useUsersHook';
import useListProjectsHook from '../Project/useListProjectsHook';
import useGetProjectHook from '../Project/useGetProjectHook';
import useGetTicketsHook from './useGetTicketsHook';
import type {Project} from '../Project/Type/types';
import type {TicketSummary} from './Type/types';

// Full Project (not just ProjectSummary) - both consumers (MyTicketsPage,
// DashboardPage's preview) only ever read `.id`/`.name` off it today, but
// MyTicketsPage also needs `.issueTypes` to render tickets through the same
// shared TicketRow every other ticket list in the app uses (status/issue-
// type pills, priority dot, progress - TicketRow can't resolve any of that
// from a bare {id, name}).
export type MyTicketGroup = {project: Project; tickets: TicketSummary[]};

// Shared by MyTicketsPage and DashboardPage's own preview - cross-project
// "assigned to me", ROOT TICKETS ONLY. The list endpoint only returns root
// tickets unless given a specific parentId, and there's no assignee-
// filtered/flat-across-depth endpoint, so a ticket assigned deep in a
// hierarchy won't show up here until backend adds something like
// GET /api/project/{id}/ticket?assigneeId={userId} (flat, any depth).
const useMyTicketsHook = () => {
  const {users} = useUsersHook();
  const {listProjects} = useListProjectsHook();
  const {getProject} = useGetProjectHook();
  const {getTickets} = useGetTicketsHook();
  const [myTicketGroups, setMyTicketGroups] = useState<MyTicketGroup[] | null>(null);

  const email = JwtManager.getInstance().getEmail();
  const me = users.find((user) => user.email === email) ?? null;

  useEffect(() => {
    if (!me) {
      return;
    }

    let cancelled = false;

    listProjects().then((result) => {
      if (!result.success) {
        return;
      }

      Promise.all(
        result.projects.map((summary) =>
          // In parallel, not chained - getProject is the heavier of the two
          // (it's the full project incl. platform docs/sub-projects, see
          // useGetProjectHook), but goes through the same projectCache every
          // other project-detail view already warms, so this is a one-time
          // cost per project rather than something paid on every visit here.
          Promise.all([getProject(summary.id), getTickets(summary.id)]).then(([projectResult, ticketsResult]) =>
            projectResult.success
              ? {
                  project: projectResult.project,
                  tickets: ticketsResult.success ? ticketsResult.tickets.filter((ticket) => ticket.assigneeIds.includes(me.id)) : [],
                }
              : null,
          ),
        ),
      ).then((entries) => {
        if (!cancelled) {
          setMyTicketGroups(entries.filter((entry): entry is MyTicketGroup => entry !== null && entry.tickets.length > 0));
        }
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listProjects/getProject/getTickets are thin useRequestHook wrappers recreated every render
  }, [me?.id]);

  return {myTicketGroups, me};
};

export default useMyTicketsHook;
