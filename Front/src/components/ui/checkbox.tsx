import {Checkbox as CheckboxPrimitive} from "@base-ui/react/checkbox";
import {Check} from "lucide-react";
import {cn} from "@/lib/utils";

export type CheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

// Thin wrapper around @base-ui/react/checkbox, same approach as Input/Select.
function Checkbox({checked, onCheckedChange, disabled, className}: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      checked={checked}
      onCheckedChange={(next) => onCheckedChange(next)}
      disabled={disabled}
      className={cn(
        // --input-background/--input-border, same reasoning as Input/Select.
        "flex h-4 w-4 shrink-0 items-center justify-center rounded border border-(--input-border) bg-(--input-background) outline-none transition-colors",
        "data-[checked]:border-accent data-[checked]:bg-accent",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-black">
        <Check className="h-3 w-3" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export {Checkbox};