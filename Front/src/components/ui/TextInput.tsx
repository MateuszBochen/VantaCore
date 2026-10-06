import type { FC, ChangeEvent } from 'react';
import type { TextInputProps } from './types';
import { Input } from '@/components/ui/input';
import {useCallback} from 'react';
import { cn } from "@/lib/utils";

const TextInput: FC<TextInputProps> = (props: TextInputProps) => {
  const propsOnChange = props.onChange;

  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (!propsOnChange) return;

    propsOnChange(e);

  }, [propsOnChange]);

  return (
    <div className="relative group w-full">
      <Input
        {...props}
        disabled={props.disabled}
        placeholder={props.label}
        onChange={onChange}
        className={cn(
          "bg-(--input-background) text-foreground placeholder:text-muted-foreground border-(--input-border)",
          props.isInvalid === true &&
          "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30"
        )}
      />
      {props.errors && props.errors?.length ? (
        <div
          className="
            absolute left-0 top-full mt-2 z-50
            hidden group-hover:block
            w-full rounded-md border border-destructive/30
            bg-popover backdrop-blur-md
            p-2 text-xs text-destructive
            shadow-lg
          "
        >
          <ul className="space-y-1">
            {props.errors.map((err, i) => (
              <li key={i}>• {err}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default TextInput;
