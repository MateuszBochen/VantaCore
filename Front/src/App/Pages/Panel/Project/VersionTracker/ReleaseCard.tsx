import {useMemo, useRef, useState} from 'react';
import {Check} from 'lucide-react';
import {Button} from '@/components/ui/button';
import useSaveReleaseHook from '@/lib/Release/useSaveReleaseHook';
import ReleaseForm from '../../../../Form/ReleaseForm/ReleaseForm';
import type {ReleaseFormData, ReleaseFormRef} from '../../../../Form/ReleaseForm/types';
import type {Release, ReleaseTicket} from '@/lib/Release/Type/types';
import type {TicketSummary} from '@/lib/Ticket/Type/types';
import type {Flag, IssueType, Status} from '@/lib/Project/Type/types';

type ReleaseCardProps = {
  projectId: string;
  release: Release;
  // This project's root tickets, for the "add tickets" picker - same
  // root-only limitation as everywhere else this app fetches a project's
  // tickets flat (see useMyTicketsHook's own comment). Merged below with
  // whatever's already on the release, so a non-root ticket already
  // attached still renders/deselects correctly even though it can't be
  // freshly added from here.
  ticketOptions: TicketSummary[];
  issueTypes: IssueType[];
  statuses: Status[];
  flags: Flag[];
  isNew?: boolean;
  onSaved: (release: Release) => void;
  onCancelNew?: () => void;
};

// One version on the Version Tracker - the fields themselves are
// ReleaseForm (Formik); this card owns saving and the Cancel/Save buttons,
// which submit through the form's ref.
const ReleaseCard = ({projectId, release, ticketOptions, issueTypes, statuses, flags, isNew, onSaved, onCancelNew}: ReleaseCardProps) => {
  const {saveRelease} = useSaveReleaseHook();
  const formRef = useRef<ReleaseFormRef>(null);
  const [saving, setSaving] = useState(false);

  // Merges the project's root tickets with whatever this release already
  // carries (which may include a ticket the root list doesn't have, if it's
  // not itself a root ticket) - keyed by id so both sources resolve through
  // one lookup for the picker's options and the TicketSummary[] rebuilt
  // after a successful save. Both sides are already TicketSummary (see
  // ReleaseTicket's own comment), so this is a plain merge, not a reshape.
  const ticketDetailsById = useMemo(() => {
    const map = new Map<string, ReleaseTicket>();
    release.tickets.forEach((ticket) => map.set(ticket.id, ticket));
    ticketOptions.forEach((ticket) => {
      if (!map.has(ticket.id)) {
        map.set(ticket.id, ticket);
      }
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- release.tickets only needs to seed this once per card instance (a fresh ReleaseCard mounts per release, see VersionTrackerPage's key), re-deriving on every keystroke isn't needed
  }, [ticketOptions]);

  // Seeded once per card instance, same reasoning as ticketDetailsById -
  // Formik only reads initialValues on mount anyway.
  const [initialValues] = useState<ReleaseFormData>(() => ({
    versionNumber: release.versionNumber,
    name: release.name,
    status: release.status,
    plannedReleaseDate: release.plannedReleaseDate,
    afterCarePeriod: release.afterCarePeriod,
    ticketIds: release.tickets.map((ticket) => ticket.id),
  }));

  const handleSubmit = (data: ReleaseFormData) => {
    setSaving(true);

    saveRelease(projectId, release.id, data, {isNew})
      .then((result) => {
        if (result.success) {
          const tickets = data.ticketIds.flatMap((id) => {
            const ticket = ticketDetailsById.get(id);
            return ticket ? [ticket] : [];
          });
          onSaved({id: release.id, projectId, ...data, tickets});
        }
      })
      .finally(() => setSaving(false));
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <ReleaseForm
        ref={formRef}
        lockForm={saving}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        projectId={projectId}
        ticketDetailsById={ticketDetailsById}
        issueTypes={issueTypes}
        statuses={statuses}
        flags={flags}
        actions={
          <>
            {isNew && (
              <Button variant="ghost" size="sm" onClick={onCancelNew}>
                Cancel
              </Button>
            )}

            <Button size="sm" leftIcon={<Check className="h-4 w-4" />} onClick={() => formRef.current?.submit()} loading={saving}>
              {isNew ? 'Create version' : 'Save'}
            </Button>
          </>
        }
      />
    </div>
  );
};

export default ReleaseCard;
