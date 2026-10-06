import {ArrowRight, Trash2, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Surface} from '@/components/ui/surface';
import {MarkdownEditor} from '@/components/MarkdownEditor';

type DocEntity = {
  id: string;
  name: string;
  color: string;
  description?: string;
};

type DocEntityPanelProps<TEntity extends DocEntity> = {
  label: string;
  entity: TEntity;
  onChange: (entity: TEntity) => void;
  onClose: () => void;
  onDelete: () => void;
  deleteLabel: string;
  descend?: {
    label: string;
    onClick: () => void;
  };
};

const DocEntityPanel = <TEntity extends DocEntity>({
  label,
  entity,
  onChange,
  onClose,
  onDelete,
  deleteLabel,
  descend,
}: DocEntityPanelProps<TEntity>) => {
  return (
    <Surface className="flex h-full w-[32rem] shrink-0 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="color"
          value={entity.color}
          onChange={(e) => onChange({...entity, color: e.target.value})}
          className="h-8 w-8 cursor-pointer rounded border border-white/20 bg-transparent p-0"
        />
        <Input value={entity.name} onChange={(e) => onChange({...entity, name: e.target.value})} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5">
        <p className="text-xs text-muted-foreground">Description</p>
        <MarkdownEditor
          className="min-h-0 flex-1"
          placeholder="Responsibilities, business rules, invariants…"
          value={entity.description ?? ''}
          exportTitle={`${label}: ${entity.name}`}
          onChange={(description) => onChange({...entity, description})}
        />
      </div>

      {descend && (
        <Button size="sm" rightIcon={<ArrowRight className="h-4 w-4" />} onClick={descend.onClick}>
          {descend.label}
        </Button>
      )}

      <Button
        size="sm"
        variant="ghost"
        leftIcon={<Trash2 className="h-4 w-4" />}
        onClick={onDelete}
        className="text-red-400 hover:text-red-300"
      >
        {deleteLabel}
      </Button>
    </Surface>
  );
};

export default DocEntityPanel;
