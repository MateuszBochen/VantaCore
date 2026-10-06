import {useCallback, useState} from 'react';
import {Plus} from 'lucide-react';
import {Button} from '@/components/ui/button';
import IssueTypeCard from './IssueTypeCard';
import type {IssueType, Status} from '../../../../../lib/Project/Type/types';

type IssueTypesSectionProps = {
  issueTypes: IssueType[];
  statuses: Status[];
  onChange: (issueTypes: IssueType[]) => void;
};

const DEFAULT_COLORS = ['#22d3ee', '#a855f7', '#f472b6', '#f97316', '#34d399', '#facc15'];

const createIssueType = (index: number): IssueType => ({
  id: crypto.randomUUID(),
  name: 'New type',
  color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  estimable: false,
  workflow: [],
  initialStatusId: null,
  childTypeIds: [],
  titleTemplate: '',
  descriptionTemplate: '',
});

// The handful of issue types nearly every tracker ships with - name/color/
// estimable plus a REAL starting title/description a new ticket of that
// type seeds itself with (see createDraftTicket / TicketEditor's own
// issue-type Select), not just field placeholder hints - a placeholder
// vanishes the moment someone starts typing or, worse, is simply never
// noticed, so anyone who doesn't deliberately fill it in submits an empty
// section; actual template text survives being ignored. Not a workflow,
// that's still statuses this project may not have yet (see
// StatusesSection), so a new project doesn't start from 5x "New type" that
// all need renaming/recoloring by hand. estimable mirrors common practice:
// Epics roll up their children's progress instead of carrying their own
// point estimate (see Ticket.estimateAll), everything else is normally sized.
const ISSUE_TYPE_TEMPLATES: {name: string; color: string; estimable: boolean; titleTemplate: string; descriptionTemplate: string}[] = [
  {
    name: 'Bug',
    color: '#f87171',
    estimable: true,
    titleTemplate: '',
    descriptionTemplate:
      '## Steps to Reproduce\n1. \n2. \n3. \n\n## Expected Result\n\n\n## Actual Result\n\n\n## Environment\n- Browser/OS: \n- Version: \n',
  },
  {
    name: 'Task',
    color: '#22d3ee',
    estimable: true,
    titleTemplate: '',
    descriptionTemplate: '## Description\n\n\n## Definition of Done\n- \n- ',
  },
  {
    name: 'Story',
    color: '#34d399',
    estimable: true,
    titleTemplate: 'As a [user], I want [goal], so that [benefit]',
    descriptionTemplate: '## Acceptance Criteria\n- \n- \n- \n\n## Notes\n',
  },
  {
    name: 'Epic',
    color: '#a855f7',
    estimable: false,
    titleTemplate: '',
    descriptionTemplate: '## Goal\n\n\n## Success Metrics\n- \n\n## Out of Scope\n- ',
  },
  {
    name: 'Sub-task',
    color: '#facc15',
    estimable: true,
    titleTemplate: '',
    descriptionTemplate: '## Details\n\n\n## Definition of Done\n- ',
  },
];

const createIssueTypeFromTemplate = (template: (typeof ISSUE_TYPE_TEMPLATES)[number]): IssueType => ({
  id: crypto.randomUUID(),
  name: template.name,
  color: template.color,
  estimable: template.estimable,
  workflow: [],
  initialStatusId: null,
  childTypeIds: [],
  titleTemplate: template.titleTemplate,
  descriptionTemplate: template.descriptionTemplate,
});

const IssueTypesSection = ({issueTypes, statuses, onChange}: IssueTypesSectionProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAdd = useCallback(() => {
    const nextType = createIssueType(issueTypes.length);
    onChange([...issueTypes, nextType]);
    setExpandedId(nextType.id);
  }, [issueTypes, onChange]);

  const handleAddFromTemplate = useCallback(
    (template: (typeof ISSUE_TYPE_TEMPLATES)[number]) => {
      const nextType = createIssueTypeFromTemplate(template);
      onChange([...issueTypes, nextType]);
      setExpandedId(nextType.id);
    },
    [issueTypes, onChange],
  );

  // Once a template's name is already in use, offering it again just invites
  // two "Bug" types - drop it from the row instead (still addable manually
  // via "Add issue type" + a rename, same as any other duplicate name today).
  const existingNames = new Set(issueTypes.map((type) => type.name.trim().toLowerCase()));
  const availableTemplates = ISSUE_TYPE_TEMPLATES.filter((template) => !existingNames.has(template.name.toLowerCase()));

  const handleUpdate = useCallback(
    (updated: IssueType) => {
      onChange(issueTypes.map((type) => (type.id === updated.id ? updated : type)));
    },
    [issueTypes, onChange],
  );

  const handleRemove = useCallback(
    (id: string) => {
      onChange(issueTypes.filter((type) => type.id !== id));
    },
    [issueTypes, onChange],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Issue types</p>
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={handleAdd}>
          Add issue type
        </Button>
      </div>

      {availableTemplates.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Templates</p>
          {availableTemplates.map((template) => (
            <Button
              key={template.name}
              variant="outline"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => handleAddFromTemplate(template)}
            >
              {template.name}
            </Button>
          ))}
        </div>
      )}

      {issueTypes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No issue types yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {issueTypes.map((type) => (
            <IssueTypeCard
              key={type.id}
              issueType={type}
              statuses={statuses}
              expanded={expandedId === type.id}
              onToggleExpand={() => setExpandedId((current) => (current === type.id ? null : type.id))}
              onChange={handleUpdate}
              onRemove={() => handleRemove(type.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default IssueTypesSection;
