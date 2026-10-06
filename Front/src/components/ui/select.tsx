import * as React from "react";
import {Select as SelectPrimitive} from "@base-ui/react/select";
import {Check, ChevronsUpDown, X} from "lucide-react";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";

export type SelectOption = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

export type SelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  // For <label htmlFor> association - lands on the Trigger, the actual
  // focusable/labelable element (Root itself renders no DOM node).
  id?: string;
};

// Thin wrapper around @base-ui/react/select (same headless-primitive approach
// as Input's InputPrimitive) collapsing its Root/Trigger/Popup/Item compound
// API into a flat value/onValueChange/options shape - callers never touch
// the underlying primitive. `value=""` maps to the primitive's `null`
// (unselected) so call sites can keep using the native-<select> convention
// of an empty string for "nothing picked yet".
function Select({value, onValueChange, options, placeholder, disabled, className, id}: SelectProps) {
  const clearable = !disabled && value !== "";

  return (
    // `className` is applied here too (not just on Trigger below) - this div,
    // not the Trigger, is the actual flex/grid item in the caller's layout,
    // so caller-supplied sizing utilities (w-48, shrink-0, flex-1, ...) have
    // to land here or they're silently ignored and the box falls back to
    // this default w-full regardless of what the caller asked for.
    <div className={cn("relative w-full", className)}>
      <SelectPrimitive.Root
        items={options}
        value={value === "" ? null : value}
        onValueChange={(next) => onValueChange(next ?? "")}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          id={id}
          className={cn(
            // --input-background/--input-border, same reasoning as Input.
            "flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-(--input-border) bg-(--input-background) px-2.5 py-1 text-base text-foreground outline-none transition-colors",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            "md:text-sm",
            clearable && "pr-8",
            className,
          )}
        >
          <SelectPrimitive.Value
            placeholder={placeholder}
            className="truncate data-[placeholder]:text-muted-foreground"
          />
          <SelectPrimitive.Icon>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Positioner sideOffset={4} className="z-50">
            <SelectPrimitive.Popup className="max-h-64 min-w-[var(--anchor-width)] overflow-y-auto rounded-lg border border-border bg-popover p-1 text-sm text-foreground shadow-xl">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 outline-none",
                    "data-[highlighted]:bg-muted",
                    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
                  )}
                >
                  <SelectPrimitive.ItemIndicator className="w-3.5 shrink-0">
                    <Check className="h-3.5 w-3.5" />
                  </SelectPrimitive.ItemIndicator>
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Popup>
          </SelectPrimitive.Positioner>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

      {/* Sibling, not nested inside Trigger - Trigger already renders a
          <button>, and a button can't validly (or accessibly) contain
          another interactive element. Reserved space for it comes from the
          Trigger's own `pr-8` above, so it never overlaps the value text. */}
      {clearable && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disableRipple
          onClick={(e) => {
            e.stopPropagation();
            onValueChange("");
          }}
          className="absolute right-1.5 top-1/2 h-5 w-5 min-w-0 -translate-y-1/2 rounded-md p-0 text-muted-foreground hover:bg-muted hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

export {Select};