import {X} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Surface} from '@/components/ui/surface';
import type {IssueType} from '../../../../../lib/Project/Type/types';

type TypePanelProps = {
  type: IssueType;
  onChange: (type: IssueType) => void;
  onClose: () => void;
};

const TypePanel = ({type, onChange, onClose}: TypePanelProps) => {
  return (
    <Surface className="flex w-80 shrink-0 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Issue type</p>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="color"
          value={type.color}
          onChange={(e) => onChange({...type, color: e.target.value})}
          className="h-8 w-8 cursor-pointer rounded border border-white/20 bg-transparent p-0"
        />
        <Input value={type.name} onChange={(e) => onChange({...type, name: e.target.value})} />
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={type.estimable}
          onChange={(e) => onChange({...type, estimable: e.target.checked})}
          className="h-4 w-4 rounded border-white/30 bg-transparent accent-cyan-400"
        />
        Estimable
      </label>
    </Surface>
  );
};

export default TypePanel;
