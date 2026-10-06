import * as React from 'react';
import {Popover as PopoverPrimitive} from '@base-ui/react/popover';
import {cn} from '@/lib/utils';

export type PopoverProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // No <Popover.Trigger> here - this is specifically for popovers opened
  // PROGRAMMATICALLY (e.g. at the location of a drag-drop, not a click),
  // anchored to whatever DOM element is passed rather than a rendered
  // trigger button. For click-triggered popups/menus, a Trigger-based
  // component would be a better fit than reusing this one.
  anchor: Element | null;
  children: React.ReactNode;
  className?: string;
};

function Popover({open, onOpenChange, anchor, children, className}: PopoverProps) {
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner anchor={anchor} sideOffset={4} className="z-50">
          <PopoverPrimitive.Popup
            className={cn('rounded-lg border border-white/10 bg-zinc-900 p-1 text-sm text-zinc-100 shadow-xl', className)}
          >
            {children}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export {Popover};
