import {useCallback} from 'react';
import {Plus, Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Surface} from '@/components/ui/surface';
import type {Flag} from '../../../../../lib/Project/Type/types';

type FlagsSectionProps = {
  flags: Flag[];
  onChange: (flags: Flag[]) => void;
};

const DEFAULT_COLORS = ['#22d3ee', '#a855f7', '#f472b6', '#f97316', '#34d399', '#facc15'];

const createFlag = (index: number): Flag => ({
  id: crypto.randomUUID(),
  name: 'New flag',
  color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
});

const FlagsSection = ({flags, onChange}: FlagsSectionProps) => {
  const handleAdd = useCallback(() => {
    onChange([...flags, createFlag(flags.length)]);
  }, [flags, onChange]);

  const handleUpdate = useCallback(
    (updated: Flag) => {
      onChange(flags.map((flag) => (flag.id === updated.id ? updated : flag)));
    },
    [flags, onChange],
  );

  const handleRemove = useCallback(
    (id: string) => {
      onChange(flags.filter((flag) => flag.id !== id));
    },
    [flags, onChange],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Flags</p>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={handleAdd}>
          Add flag
        </Button>
      </div>

      {flags.length === 0 ? (
        <p className="text-sm text-muted-foreground">No flags yet — tickets will have nothing to pick from until you add some.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {flags.map((flag) => (
            <Surface key={flag.id} className="flex items-center gap-3 p-4">
              <input
                type="color"
                value={flag.color}
                onChange={(e) => handleUpdate({...flag, color: e.target.value})}
                className="h-8 w-8 cursor-pointer rounded border border-white/20 bg-transparent p-0"
              />

              <Input
                value={flag.name}
                onChange={(e) => handleUpdate({...flag, name: e.target.value})}
                className="max-w-xs"
              />

              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleRemove(flag.id)}
                className="ml-auto h-8 w-8 text-muted-foreground hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlagsSection;
