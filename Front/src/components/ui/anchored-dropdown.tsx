import * as React from "react";
import {Popover as PopoverPrimitive} from "@base-ui/react/popover";
import {cn} from "@/lib/utils";

type AnchoredDropdownProps = {
  open: boolean;
  // The element the list hangs under (usually the input's wrapper) - the
  // list also takes its width (--anchor-width).
  anchor: React.RefObject<Element | null>;
  children: React.ReactNode;
  className?: string;
};

const noop = () => {};

// Suggestion/result list for a typing field whose host owns everything else
// - open state, keyboard navigation, closing on blur/Escape (ChipInput,
// TicketPickerInput). Rendered through a portal at the end of <body>, same
// as Select/Combobox, so no sibling's z-index can paint over it and no
// scrolling/overflow-hidden ancestor (the search filters panel, TicketPopup)
// can clip it - the inline `absolute z-*` list it replaces had both
// problems (tri-state switch showing through the Tags suggestions).
//
// Deliberately passive: onOpenChange is ignored (the host already closes on
// blur/Escape, and an outside press IS a blur) and focus never moves into
// the list (initialFocus/finalFocus false), so typing stays in the input.
// Rows should preventDefault on mousedown to keep the input focused.
function AnchoredDropdown({open, anchor, children, className}: AnchoredDropdownProps) {
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={noop}>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner anchor={anchor} side="bottom" align="start" sideOffset={4} className="z-50">
          <PopoverPrimitive.Popup
            initialFocus={false}
            finalFocus={false}
            className={cn(
              "w-(--anchor-width) overflow-y-auto rounded-lg border border-border bg-popover p-1 text-sm text-foreground shadow-xl outline-none",
              className,
            )}
          >
            {children}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export {AnchoredDropdown};
