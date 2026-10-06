import {Popover} from '@/components/ui/popover';
import {cn} from '@/lib/utils';
import type {StatusMeta} from './SprintRailBoard';
import {statusKey} from './statusKey';

export type StatusPickerState = {statusIds: string[]; anchor: Element};

type StatusPickerPopoverProps = {
  picker: StatusPickerState;
  issueTypeId: string;
  statusMetaById: Record<string, StatusMeta>;
  allowedNextStatusIds: string[];
  onSelect: (statusId: string) => void;
  onClose: () => void;
};

// Listing anchored at the cell that was dropped on (or the status badge that
// was clicked). Whichever options aren't allowed by the configured workflow
// are shown disabled rather than hidden - the user can see what's blocked,
// not just what's available (explicit ask 2026-08-07).
const StatusPickerPopover = ({picker, issueTypeId, statusMetaById, allowedNextStatusIds, onSelect, onClose}: StatusPickerPopoverProps) => (
  <Popover open onOpenChange={(open) => !open && onClose()} anchor={picker.anchor}>
    <div className="flex min-w-36 flex-col gap-0.5">
      {picker.statusIds.flatMap((statusId) => {
        const optionMeta = statusMetaById[statusKey(issueTypeId, statusId)];

        if (!optionMeta) {
          return [];
        }

        const allowed = allowedNextStatusIds.includes(statusId);

        return [
          <button
            key={statusId}
            type="button"
            disabled={!allowed}
            onClick={() => onSelect(statusId)}
            className={cn(
              'flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs',
              allowed ? 'text-foreground hover:bg-muted' : 'cursor-not-allowed text-muted-foreground',
            )}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{backgroundColor: allowed ? optionMeta.color : undefined}}
            />
            {optionMeta.name}
          </button>,
        ];
      })}
    </div>
  </Popover>
);

export default StatusPickerPopover;
