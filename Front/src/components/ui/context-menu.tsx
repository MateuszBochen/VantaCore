import type {CSSProperties, PointerEventHandler, ReactNode} from 'react';
import {ContextMenu as ContextMenuPrimitive} from '@base-ui/react/context-menu';
import {cn} from '@/lib/utils';

export type ContextMenuItem = {
  label: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  destructive?: boolean;
};

export type ContextMenuProps = {
  items: ContextMenuItem[];
  children: ReactNode;
  className?: string;
  // Forwarded straight onto the Trigger - lets a caller like
  // WorklogTimeBlock use the Trigger itself as its absolutely-positioned,
  // drag-guarding element instead of needing an extra wrapping div.
  style?: CSSProperties;
  onPointerDown?: PointerEventHandler<HTMLDivElement>;
};

// Right-click menu, built on @base-ui/react/context-menu (same
// Root/Trigger/Portal/Positioner/Popup/Item shape as the `menu` primitive,
// styled to match Select's own Popup/Item conventions). Trigger renders its
// own <div> and forwards standard div props straight through
// (BaseUIComponentProps<'div', ...>), so `className`/`style`/`onPointerDown`
// land directly on it - no extra wrapping DOM node, which matters for
// callers like WorklogTimeBlock that need to stay an absolutely-positioned
// element with nothing in between it and its grid parent.
function ContextMenu({items, children, className, style, onPointerDown}: ContextMenuProps) {
  return (
    <ContextMenuPrimitive.Root>
      <ContextMenuPrimitive.Trigger className={className} style={style} onPointerDown={onPointerDown}>
        {children}
      </ContextMenuPrimitive.Trigger>

      <ContextMenuPrimitive.Portal>
        <ContextMenuPrimitive.Positioner className="z-50">
          {/* Popup is rendered into a Portal, but React re-parents its bubbling to
              the component tree above (Trigger), not the DOM position - without this,
              a pointerdown on a menu item still reaches the grid column's own
              onPointerDown drag-to-select handler underneath the Trigger and opens the
              "Log time" popup right after a menu selection. */}
          <ContextMenuPrimitive.Popup
            onPointerDown={(e) => e.stopPropagation()}
            className="min-w-36 rounded-lg border border-border bg-popover p-1 text-sm text-foreground shadow-xl"
          >
            {items.map((item, index) => (
              <ContextMenuPrimitive.Item
                key={index}
                disabled={item.disabled}
                onClick={item.onSelect}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 outline-none',
                  'data-[highlighted]:bg-muted',
                  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
                  item.destructive ? 'text-destructive' : 'text-foreground',
                )}
              >
                {item.label}
              </ContextMenuPrimitive.Item>
            ))}
          </ContextMenuPrimitive.Popup>
        </ContextMenuPrimitive.Positioner>
      </ContextMenuPrimitive.Portal>
    </ContextMenuPrimitive.Root>
  );
}

export {ContextMenu};
