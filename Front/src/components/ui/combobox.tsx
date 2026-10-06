import {Combobox as ComboboxPrimitive} from "@base-ui/react/combobox";
import {Check, ChevronsUpDown, X} from "lucide-react";
import {cn} from "@/lib/utils";
import {Avatar} from "@/components/ui/avatar";

export type ComboboxOption = {
  value: string;
  label: string;
  // Optional - only user-directory pickers have one, shown on the chip(s)
  // and in the dropdown list (the input's own typed text stays plain text).
  avatarUrl?: string;
  disabled?: boolean;
};

type ComboboxBaseProps = {
  options: ComboboxOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export type ComboboxProps =
  | (ComboboxBaseProps & {
      multiple?: false;
      value: string;
      onValueChange: (value: string) => void;
    })
  | (ComboboxBaseProps & {
      multiple: true;
      value: string[];
      onValueChange: (value: string[]) => void;
    });

const inputGroupClassName = cn(
  // --input-background/--input-border, same reasoning as Input/Select/Checkbox/Textarea.
  "flex min-h-8 w-full min-w-0 items-center gap-1.5 rounded-lg border border-(--input-border) bg-(--input-background) px-2.5 py-1 text-base text-foreground transition-colors",
  "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
  "has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50",
  "md:text-sm",
);

// Searchable picker over a directory (@base-ui/react/combobox). Single-select
// (default) looks identical to `multiple` - one chip with its avatar instead
// of plain text - it just caps the primitive's own multi-select array at one
// entry: picking a new item replaces rather than adds to it, and the array
// is collapsed back to a bare string for the single-select external API.
// Both modes drive the primitive's `multiple` mode internally so they share
// one chips-rendering implementation instead of two visually-diverging ones.
//
// The input's displayed text does NOT auto-resolve from `items`' {value,label}
// shape the way Select.Value does - that auto-detection only kicks in when
// the item's own `value` IS that {value,label} object, and ours is a bare
// string (the id). `itemToStringLabel` is what actually drives the input text.
function Combobox(props: ComboboxProps) {
  const {options, placeholder, disabled, className} = props;
  const itemToStringLabel = (itemValue: string) =>
    options.find((option) => option.value === itemValue)?.label ?? itemValue;

  const value = props.multiple ? props.value : props.value === "" ? [] : [props.value];

  const handleValueChange = (next: string[]) => {
    if (props.multiple) {
      props.onValueChange(next);
      return;
    }

    // Collapse to the most recently picked item - only one chip is ever fed
    // back down as `value`, so only one can ever be shown.
    props.onValueChange(next[next.length - 1] ?? "");
  };

  return (
    <ComboboxPrimitive.Root
      items={options}
      itemToStringLabel={itemToStringLabel}
      multiple
      value={value}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <ComboboxPrimitive.InputGroup className={cn(inputGroupClassName, className)}>
        <ComboboxPrimitive.Chips className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {value.map((id) => {
            const option = options.find((candidate) => candidate.value === id) ?? {value: id, label: id};

            return (
              <ComboboxPrimitive.Chip
                key={id}
                className="flex items-center gap-1 rounded-full bg-muted py-0.5 pl-1 pr-2 text-xs text-foreground outline-none data-[highlighted]:bg-border"
              >
                {option.avatarUrl !== undefined && (
                  <Avatar name={option.label} src={option.avatarUrl} className="h-4 w-4 text-[8px]" />
                )}
                {option.label}
                <ComboboxPrimitive.ChipRemove className="text-muted-foreground hover:text-destructive">
                  <X className="h-3 w-3" />
                </ComboboxPrimitive.ChipRemove>
              </ComboboxPrimitive.Chip>
            );
          })}

          <ComboboxPrimitive.Input
            placeholder={value.length === 0 ? placeholder : undefined}
            className="min-w-16 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </ComboboxPrimitive.Chips>

        <ComboboxPrimitive.Icon>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </ComboboxPrimitive.Icon>
      </ComboboxPrimitive.InputGroup>

      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner sideOffset={4} className="z-50">
          <ComboboxPrimitive.Popup className="max-h-64 min-w-[var(--anchor-width)] overflow-y-auto rounded-lg border border-border bg-popover p-1 text-sm text-foreground shadow-xl">
            <ComboboxPrimitive.Empty className="px-2 py-1.5 text-xs text-muted-foreground">No results.</ComboboxPrimitive.Empty>
            <ComboboxPrimitive.List>
              {(option: ComboboxOption) => (
                <ComboboxPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 outline-none",
                    "data-[highlighted]:bg-muted",
                    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
                  )}
                >
                  <ComboboxPrimitive.ItemIndicator className="w-3.5 shrink-0">
                    <Check className="h-3.5 w-3.5" />
                  </ComboboxPrimitive.ItemIndicator>
                  {option.avatarUrl !== undefined && <Avatar name={option.label} src={option.avatarUrl} />}
                  {option.label}
                </ComboboxPrimitive.Item>
              )}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  );
}

export {Combobox};
