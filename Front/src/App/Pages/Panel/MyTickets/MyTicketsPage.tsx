import {PageContainer} from '@/components/ui/page-container';
import {useSetModuleTitle} from '../ModuleTitle';
import {useSetBreadcrumb} from '../Breadcrumb';
import useMyTicketsHook from '@/lib/Ticket/useMyTicketsHook';
import TicketRow from '../Project/Tickets/TicketRow';

// Cross-project "assigned to me" view - not in the PrismMenu tree (top-level
// flat entry, see menu.tsx), reached via the sidebar's "My tickets" link (or
// the compact preview on DashboardPage). See useMyTicketsHook's own comment
// for why this is root-tickets-only.
const MyTicketsPage = () => {
  const {myTicketGroups, me} = useMyTicketsHook();

  useSetModuleTitle('My tickets');
  useSetBreadcrumb([{label: 'My tickets', link: null}]);

  if (!me) {
    return <p className="p-8 text-sm text-muted-foreground">Loading…</p>;
  }

  const totalCount = myTicketGroups?.reduce((sum, entry) => sum + entry.tickets.length, 0) ?? 0;

  return (
    <PageContainer>
      <p className="text-sm font-semibold text-foreground">My tickets</p>

      {myTicketGroups === null ? (
        <p className="text-sm text-muted-foreground">Loading tickets…</p>
      ) : totalCount === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing assigned to you (root tickets only - see note in the code).</p>
      ) : (
        <div className="flex flex-col gap-6">
          {myTicketGroups.map(({project, tickets}) => (
            <div key={project.id} className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{project.name}</p>

              <div className="flex flex-col gap-2">
                {tickets.map((ticket) => (
                  <TicketRow
                    key={ticket.id}
                    projectId={project.id}
                    ticket={ticket}
                    issueTypes={project.issueTypes}
                    statuses={project.statuses}
                    flags={project.flags}
                    depth={0}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
};

export default MyTicketsPage;
