import {useState} from 'react';
import {Pencil} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';
import useTicketLayoutPreference from '@/lib/TicketLayout/useTicketLayoutPreference';
import {BUILT_IN_GRID_TEMPLATES, resolveGridLayout} from '../Project/Tickets/ticketLayoutTemplates';
import TicketLayoutEditor from './TicketLayoutEditor';
import type {TicketLayoutSlot, WidgetLayoutItem} from '@/lib/TicketLayout/Type/types';

type LayoutOption = {
  slot: TicketLayoutSlot;
  label: string;
  description: string;
};

const OPTIONS: LayoutOption[] = [
  {
    slot: 'default',
    label: 'Default',
    description: "Today's layout - a rotating panel of fields on the side, everything else (Children, Worklog, Comments, ...) as separate tabs.",
  },
  {
    slot: 'devops',
    label: 'DevOps (3 columns)',
    description: 'Description and comments, fields, and everything else side by side in three columns - no tabs, all on one screen.',
  },
  {
    slot: 'jira',
    label: 'Jira-style',
    description: 'A wide main column (description, children, related tickets, comments) with fields in a narrow sidebar - no tabs, all on one screen.',
  },
  {
    slot: 'custom',
    label: 'Custom',
    description: 'Build your own arrangement from scratch by dragging and resizing sections.',
  },
];

// Per-user (not per-project) preference for how ticket pages are laid out -
// applies to every project's tickets the moment it changes, everywhere
// (see useTicketLayoutPreference, same live-sync-via-eventBus pattern as
// the theme picker). Selecting a card makes it the active layout; the
// pencil opens TicketLayoutEditor for that slot without changing which one
// is active (editing and viewing are separate actions - you can prepare a
// layout before switching to it).
const TicketLayoutPreferenceSection = () => {
  const {preference, setPreference} = useTicketLayoutPreference();
  const [editingSlot, setEditingSlot] = useState<TicketLayoutSlot | null>(null);

  const handleSelect = (slot: TicketLayoutSlot) => {
    if (slot === preference.activeSlot) {
      return;
    }

    setPreference({...preference, activeSlot: slot});
  };

  const handleSaveEdit = (layout: WidgetLayoutItem[]) => {
    if (!editingSlot) {
      return;
    }

    setPreference({...preference, slots: {...preference.slots, [editingSlot]: layout}});
    setEditingSlot(null);
  };

  if (editingSlot) {
    return (
      <TicketLayoutEditor
        slot={editingSlot}
        initialLayout={resolveGridLayout(preference, editingSlot)}
        builtInLayout={BUILT_IN_GRID_TEMPLATES[editingSlot] ?? []}
        onSave={handleSaveEdit}
        onCancel={() => setEditingSlot(null)}
      />
    );
  }

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Ticket layout</p>
        <p className="text-xs text-muted-foreground">Choose how ticket pages are arranged - applies to every project.</p>
      </div>

      <div className="flex flex-col gap-2">
        {OPTIONS.map((option) => {
          const active = preference.activeSlot === option.slot;

          return (
            <div
              key={option.slot}
              className={cn(
                'flex items-start gap-2 rounded-xl border p-4 transition-colors',
                active ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/30',
              )}
            >
              <button type="button" onClick={() => handleSelect(option.slot)} className="flex min-w-0 flex-1 flex-col gap-1 text-left">
                <span className={cn('text-sm font-medium', active ? 'text-accent' : 'text-foreground')}>{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                disableRipple
                onClick={() => setEditingSlot(option.slot)}
                className="h-8 w-8 min-w-0 shrink-0 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TicketLayoutPreferenceSection;
