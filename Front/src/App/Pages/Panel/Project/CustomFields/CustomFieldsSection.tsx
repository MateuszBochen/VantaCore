import {useCallback} from 'react';
import {Plus, Trash2, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Select} from '@/components/ui/select';
import {Checkbox} from '@/components/ui/checkbox';
import {Surface} from '@/components/ui/surface';
import type {CustomFieldDefinition, CustomFieldType} from '../../../../../lib/Project/Type/types';

type CustomFieldsSectionProps = {
  customFieldDefinitions: CustomFieldDefinition[];
  onChange: (customFieldDefinitions: CustomFieldDefinition[]) => void;
};

const FIELD_TYPES: {value: CustomFieldType; label: string}[] = [
  {value: 'text', label: 'Text'},
  {value: 'number', label: 'Number'},
  {value: 'select', label: 'Select'},
  {value: 'date', label: 'Date'},
  {value: 'time', label: 'Time'},
  {value: 'dateTime', label: 'Date & Time'},
  {value: 'checkbox', label: 'Checkbox'},
  {value: 'user', label: 'User'},
];

const createCustomField = (): CustomFieldDefinition => ({
  id: crypto.randomUUID(),
  name: 'New field',
  type: 'text',
});

const CustomFieldsSection = ({customFieldDefinitions, onChange}: CustomFieldsSectionProps) => {
  const handleAdd = useCallback(() => {
    onChange([...customFieldDefinitions, createCustomField()]);
  }, [customFieldDefinitions, onChange]);

  const handleUpdate = useCallback(
    (updated: CustomFieldDefinition) => {
      onChange(customFieldDefinitions.map((field) => (field.id === updated.id ? updated : field)));
    },
    [customFieldDefinitions, onChange],
  );

  const handleRemove = useCallback(
    (id: string) => {
      onChange(customFieldDefinitions.filter((field) => field.id !== id));
    },
    [customFieldDefinitions, onChange],
  );

  const handleTypeChange = useCallback(
    (field: CustomFieldDefinition, type: CustomFieldType) => {
      // `options` only means anything for 'select'; `multiple` for
      // 'select'/'user' - drop them when leaving those types, seed sensible
      // defaults when arriving.
      handleUpdate({
        ...field,
        type,
        options: type === 'select' ? (field.options ?? ['']) : undefined,
        multiple: type === 'user' || type === 'select' ? (field.multiple ?? false) : undefined,
      });
    },
    [handleUpdate],
  );

  const handleOptionChange = useCallback(
    (field: CustomFieldDefinition, index: number, value: string) => {
      const options = [...(field.options ?? [])];
      options[index] = value;
      handleUpdate({...field, options});
    },
    [handleUpdate],
  );

  const handleAddOption = useCallback(
    (field: CustomFieldDefinition) => {
      handleUpdate({...field, options: [...(field.options ?? []), '']});
    },
    [handleUpdate],
  );

  const handleRemoveOption = useCallback(
    (field: CustomFieldDefinition, index: number) => {
      handleUpdate({...field, options: (field.options ?? []).filter((_, i) => i !== index)});
    },
    [handleUpdate],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Custom fields</p>
          <p className="text-xs text-muted-foreground">Shared across every issue type in this project - tickets of any type get the same fields.</p>
        </div>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={handleAdd}>
          Add field
        </Button>
      </div>

      {customFieldDefinitions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No custom fields yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {customFieldDefinitions.map((field) => (
            <Surface key={field.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-center gap-3">
                <Input
                  value={field.name}
                  onChange={(e) => handleUpdate({...field, name: e.target.value})}
                  className="max-w-xs"
                />

                <Select
                  value={field.type}
                  onValueChange={(value) => handleTypeChange(field, value as CustomFieldType)}
                  className="w-40"
                  options={FIELD_TYPES}
                />

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleRemove(field.id)}
                  className="ml-auto h-8 w-8 text-muted-foreground hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {field.type === 'select' && (
                <div className="flex flex-col gap-2 border-t border-border pt-3">
                  <p className="text-left text-xs uppercase tracking-widest text-muted-foreground">Options</p>

                  {(field.options ?? []).map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => handleOptionChange(field, index, e.target.value)}
                        className="max-w-xs"
                        placeholder={`Option ${index + 1}`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveOption(field, index)}
                        className="h-8 w-8 text-muted-foreground hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button size="sm" variant="ghost" className="w-fit" onClick={() => handleAddOption(field)}>
                    Add option
                  </Button>
                </div>
              )}

              {(field.type === 'user' || field.type === 'select') && (
                <div className="flex items-center gap-2 border-t border-border pt-3">
                  <Checkbox
                    checked={field.multiple === true}
                    onCheckedChange={(checked) => handleUpdate({...field, multiple: checked})}
                  />
                  <p className="text-left text-xs text-muted-foreground">
                    Allow selecting multiple {field.type === 'user' ? 'users' : 'options'}
                  </p>
                </div>
              )}
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomFieldsSection;
