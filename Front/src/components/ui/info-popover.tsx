import * as React from "react";
import {Popover as PopoverPrimitive} from "@base-ui/react/popover";
import {Info} from "lucide-react";
import {cn} from "@/lib/utils";

type InfoPopoverProps = {
  // Accessible name for the icon-only trigger, e.g. "How search works".
  label: string;
  children: React.ReactNode;
  className?: string;
};

// Small "i" icon that opens an explanation on click - for inline help next
// to a field label. Click-triggered (base-ui Popover.Trigger), unlike
// ui/popover.tsx, which is for popovers opened programmatically at an
// arbitrary anchor.
function InfoPopover({label, children, className}: InfoPopoverProps) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        aria-label={label}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <Info className="h-3.5 w-3.5" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner side="bottom" align="start" sideOffset={6} className="z-50">
          <PopoverPrimitive.Popup
            className={cn(
              "max-h-[70vh] w-80 overflow-y-auto rounded-lg border border-border bg-popover p-3 text-xs leading-relaxed text-foreground shadow-xl outline-none",
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

export {InfoPopover};
