import {memo, useState} from 'react';
import Stepper, {type StepperStep} from '@/components/ui/Stepper';
import {useFaceWidth} from '@/components/PrismMenu/useFaceWidth';
import TicketFieldsSidebar from './TicketFieldsSidebar';
import TicketCustomFieldsSection from './TicketCustomFieldsSection';
import TicketWorklogStopwatch from './TicketWorklogStopwatch';
import TicketChildrenSection from './TicketChildrenSection';
import TicketRelatedSection from './TicketRelatedSection';
import type {ProjectSprintOption} from '@/lib/Sprint/useListProjectSprintsHook';
import type {Project} from '@/lib/Project/Type/types';
import type {Ticket} from '@/lib/Ticket/Type/types';

type TicketSidebarProps = {
  project: Project;
  // A snapshot that's memoized against everything EXCEPT title/description
  // (see TicketEditor's sidebarTicket) - deliberately stale on those two
  // fields between recomputes, which every face below relies on since none
  // of them read or write either one.
  ticket: Ticket;
  // A patch, not the whole next Ticket - see TicketFieldsSidebar's onChange
  // comment for why.
  onChange: (patch: Partial<Ticket>) => void;
  projectId: string;
  // isNew: Children/Related need a persisted ticket id and the worklog
  // stopwatch logs against one too, none of which exist yet - the prism only
  // ever gets the Fields/Custom Fields faces in that case (see `faces` below),
  // rather than switching to an entirely different flat layout - a ticket
  // shouldn't visually change how its own sidebar behaves the moment it's saved.
  isNew: boolean;
  // Fetched once by TicketEditor (owns the submit-time diff against it too,
  // see handleSubmit) rather than by TicketFieldsSidebar itself - both need
  // the same project-scoped sprint list, and fetching it twice would risk
  // the dropdown's options and the submit-time board lookup disagreeing.
  sprintOptions: ProjectSprintOption[];
};

const ALL_FACES: StepperStep[] = [
  {id: 'fields', label: 'Fields'},
  {id: 'custom-fields', label: 'Custom Fields'},
  {id: 'worklog', label: 'Worklog'},
  {id: 'children', label: 'Children'},
  {id: 'related', label: 'Related'},
];

// Same fixed-angle-per-face technique as PrismMenu (see useFaceWidth, reused
// verbatim), simplified for a known, fixed set of faces instead of an
// infinite-depth tree: every face is mounted at all times, at its own
// rotateY angle (360 / face count apart), and the whole box just rotates to
// bring one to the front - no depth stack, no physical-face recycling, and
// (unlike PrismMenu) any face can be jumped to directly rather than only ±1
// at a time.
//
// Distance each face sits out from the prism's center axis. For a regular
// N-gon this is width / (2 * tan(pi/N)) - width/2 (what a 4-face prism like
// PrismMenu uses) is really just this formula's N=4 special case
// (tan(45deg) = 1). N=2 (isNew) is a degenerate case for that formula
// (tan(90deg) is ~infinite, collapsing both faces onto the rotation axis) -
// a plain flip card's width/2 is what that case actually wants.
const faceRadiusMultiplier = (faceCount: number): number =>
  faceCount <= 2 ? 0.5 : 1 / (2 * Math.tan(Math.PI / faceCount));

// The sidebar kept growing (fields, custom fields, worklog, children,
// related all stacked in one narrow column) until it was as long as the
// description itself. Splits it into faces of an actual rotating 3D prism -
// this lives entirely inside this column (its own viewport/perspective), so
// the description in the sibling column is never hidden by it.
const TicketSidebar = memo(({project, ticket, onChange, projectId, isNew, sprintOptions}: TicketSidebarProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  // Tracks whose faces `activeIndex` currently refers to, so switching
  // tickets can reset it synchronously during render (React's own
  // recommended "adjusting state when a prop changes" pattern) rather than
  // through an Effect, which would paint the stale face for one frame first.
  const [activeIndexForId, setActiveIndexForId] = useState(ticket.id);
  const viewportRef = useFaceWidth<HTMLDivElement>();

  // The rotation transform below drives its angle straight off `activeIndex`
  // (needed for the ±1-index-independent "jump to any face" behavior noted
  // above), so it has no way to know a stale index landed on the WRONG face
  // once `faces` has a different length than it did when that index was set
  // - only the Stepper's own `activeId` (computed with a `?? faces[0].id`
  // fallback) silently coped, which is what made this look like "the label
  // says Fields but the panel shows Custom Fields": switching from an
  // existing ticket's Children/Related face (index 3/4) straight to a fresh
  // "Add child" draft (only 2 faces) kept that now out-of-range index, and
  // rotateY(-index * angleStep) still wrapped it onto a real, just wrong,
  // face instead of erroring. Resetting on the ticket's own identity - not
  // on `faces.length` - is what actually matches user intent: opening any
  // different ticket (new draft or a different existing one) should start
  // back on Fields, not just whenever the face count happens to change.
  if (ticket.id !== activeIndexForId) {
    setActiveIndexForId(ticket.id);
    setActiveIndex(0);
  }

  const faces = isNew ? ALL_FACES.slice(0, 2) : ALL_FACES;

  const faceContent = [
    <TicketFieldsSidebar key="fields" project={project} ticket={ticket} onChange={onChange} sprintOptions={sprintOptions} />,
    <TicketCustomFieldsSection key="custom-fields" project={project} ticket={ticket} onChange={onChange} />,
    ...(isNew
      ? []
      : [
          <TicketWorklogStopwatch key="worklog" projectId={projectId} ticket={ticket} onChange={onChange} />,
          <TicketChildrenSection
            key="children"
            projectId={projectId}
            ticket={ticket}
            issueTypes={project.issueTypes}
            statuses={project.statuses}
            flags={project.flags}
          />,
          <TicketRelatedSection key="related" ticket={ticket} onChange={onChange} />,
        ]),
  ];

  const angleStep = 360 / faces.length;
  const radiusMultiplier = faceRadiusMultiplier(faces.length);
  const activeId = faces[activeIndex]?.id ?? faces[0].id;

  return (
    <div className="flex w-full shrink-0 flex-col gap-4 rounded-2xl border border-border bg-card p-5 lg:w-80">
      <Stepper
        steps={faces}
        activeId={activeId}
        onSelect={(id) => setActiveIndex(faces.findIndex((face) => face.id === id))}
        showNumbers={false}
        className="flex-none gap-1.5 border-b-0 pb-0"
      />

      {/* min-h-0, not a fixed floor: this card's height comes entirely from
          the row it sits in (see TicketEditor's two-column row, itself
          min-h-0) via flex stretch - a hardcoded min-height here can demand
          more than that row ever had to give (confirmed live: 428px actual
          vs ~470px needed for Stepper + a 420px floor), and since neither
          this div nor its `bg-card` parent clips overflow, the excess just
          spills past the card's rounded border onto the page below,
          overlapping TicketEditor's History/Submit footer. Letting it
          shrink to whatever's actually available means the difference shows
          up as an internal scrollbar (see the face content div below)
          instead of bleeding out. */}
      <div ref={viewportRef} className="relative min-h-0 flex-1 overflow-hidden [perspective:1200px]">
        <div
          className="relative h-full w-full transition-transform duration-500 ease-in-out [transform-style:preserve-3d]"
          style={{
            transform: `translateZ(calc(-1 * var(--face-width, 260px) * ${radiusMultiplier})) rotateY(${-activeIndex * angleStep}deg)`,
          }}
        >
          {faceContent.map((content, index) => {
            const isCurrent = index === activeIndex;

            return (
              <div
                key={faces[index].id}
                className="absolute inset-0 [backface-visibility:hidden]"
                style={{
                  transform: `rotateY(${index * angleStep}deg) translateZ(calc(var(--face-width, 260px) * ${radiusMultiplier}))`,
                }}
                aria-hidden={!isCurrent}
                inert={!isCurrent || undefined}
              >
                {/* overflow-y-auto lives on this plain, untransformed div
                    instead of the rotated one above it - browsers don't
                    reliably clip an element's own overflow when that same
                    element also carries a 3D transform inside a preserve-3d/
                    perspective context (confirmed live: the last field
                    (Progress) rendered past the card's rounded border, onto
                    the page background below, overlapping the History/Submit
                    footer, instead of scrolling inside the card). */}
                <div className="h-full overflow-y-auto pr-1">{content}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

TicketSidebar.displayName = 'TicketSidebar';

export default TicketSidebar;
