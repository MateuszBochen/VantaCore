import {useSearchParams} from 'react-router-dom';
import {ArrowLeft, Plus, Trash2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Surface} from '@/components/ui/surface';
import {MarkdownEditor} from '@/components/MarkdownEditor';
import {AttachmentMediaPicker} from '@/components/Attachment';
import type {Adr, SubProject} from '@/lib/Project/Type/types';

type AdrSectionProps = {
  subProject: SubProject;
  onChange: (subProject: SubProject) => void;
  // ids of ADRs that exist in the last persisted version of this sub-project -
  // anything else is still local-only, so the list offers a quick delete for
  // it without having to open it first (see SubProjectDocumentationPage).
  savedAdrIds: string[];
  // Null for an isNew sub-project (no id to attach files to yet) - see
  // SubProjectDocumentationPage's own attachmentBasePath.
  attachmentBasePath: string | null;
};

const createAdr = (): Adr => ({
  id: crypto.randomUUID(),
  title: 'New decision',
  content: '',
});

// ADR is a numbered list of standalone markdown+mermaid docs (Michael Nygard
// convention: 0001-, 0002-, ...) rather than a single doc like the other three
// doc types - so it gets its own list+editor navigation via ?adrId=.
const AdrSection = ({subProject, onChange, savedAdrIds, attachmentBasePath}: AdrSectionProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const adrId = searchParams.get('adrId');

  const adrs = subProject.documentation.adrs;
  const selectedIndex = adrs.findIndex((adr) => adr.id === adrId);
  const selectedAdr = selectedIndex >= 0 ? adrs[selectedIndex] : null;

  const handleAdd = () => {
    const adr = createAdr();
    onChange({...subProject, documentation: {...subProject.documentation, adrs: [...adrs, adr]}});
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('adrId', adr.id);
      return next;
    });
  };

  const handleSelect = (id: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('adrId', id);
      return next;
    });
  };

  const handleBack = () => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('adrId');
      return next;
    });
  };

  const handleUpdate = (updated: Adr) => {
    onChange({
      ...subProject,
      documentation: {
        ...subProject.documentation,
        adrs: adrs.map((adr) => (adr.id === updated.id ? updated : adr)),
      },
    });
  };

  const handleDelete = (id: string) => {
    onChange({...subProject, documentation: {...subProject.documentation, adrs: adrs.filter((adr) => adr.id !== id)}});
    handleBack();
  };

  if (selectedAdr) {
    const number = String(selectedIndex + 1).padStart(4, '0');

    return (
      <div className="flex h-full min-h-0 flex-col gap-4">
        <button type="button" onClick={handleBack} className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          ADRs
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-muted-foreground">{number}</span>
          <Input value={selectedAdr.title} onChange={(e) => handleUpdate({...selectedAdr, title: e.target.value})} />
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<Trash2 className="h-4 w-4" />}
            onClick={() => handleDelete(selectedAdr.id)}
            className="text-red-400 hover:text-red-300"
          >
            Delete
          </Button>
        </div>

        <MarkdownEditor
          className="min-h-0 flex-1"
          value={selectedAdr.content}
          exportTitle={`${subProject.name} - ADR ${number} ${selectedAdr.title}`}
          onChange={(content) => handleUpdate({...selectedAdr, content})}
          imagePicker={
            attachmentBasePath
              ? (onSelect) => (
                  <AttachmentMediaPicker basePath={attachmentBasePath} label="Sub-project attachments" onSelect={onSelect} />
                )
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">ADRs</p>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={handleAdd}>
          Add ADR
        </Button>
      </div>

      {adrs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No ADRs yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {adrs.map((adr, index) => (
            <Surface key={adr.id} className="flex items-center gap-3 p-4 text-sm text-foreground hover:border-white/20">
              <button
                type="button"
                onClick={() => handleSelect(adr.id)}
                className="flex flex-1 items-center gap-3 text-left"
              >
                <span className="font-mono text-muted-foreground">{String(index + 1).padStart(4, '0')}</span>
                {adr.title}
              </button>
              {!savedAdrIds.includes(adr.id) && (
                <button
                  type="button"
                  onClick={() => handleDelete(adr.id)}
                  aria-label={`Delete ${adr.title}`}
                  className="flex-shrink-0 text-muted-foreground hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdrSection;
