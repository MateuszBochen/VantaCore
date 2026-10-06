import {useSearchParams} from 'react-router-dom';
import Stepper, {type StepperStep} from '@/components/ui/Stepper';
import {MarkdownEditor} from '@/components/MarkdownEditor';
import {AttachmentsSection, AttachmentMediaPicker} from '@/components/Attachment';
import DomainsDrilldown from './Platform/DomainsDrilldown';
import InfraDrilldown from './Platform/InfraDrilldown';
import type {PlatformDocumentation} from '@/lib/Project/Type/types';

const CATEGORIES: StepperStep[] = [
  {id: 'architecture-overview', label: 'Architecture Overview'},
  {id: 'domains', label: 'Domains'},
  {id: 'infrastructure', label: 'Infrastructure'},
  {id: 'api', label: 'API'},
  {id: 'attachments', label: 'Attachments'},
];

type PlatformDocumentationSectionProps = {
  projectId: string;
  // Only for the "Export to PDF" title ("<project> - <tab>").
  projectName: string;
  platformDocumentation: PlatformDocumentation;
  onChange: (platformDocumentation: PlatformDocumentation) => void;
};

// "Domains" is the single entry point into the domains -> bounded-contexts ->
// components -> data-flow drill-down chain - each level is its own graph,
// reached by descending into a node (see Platform/DomainsDrilldown.tsx), so
// data-flow has no separate top-level tab of its own. Infrastructure is a
// separate, parallel drill-down (cluster -> services, see
// Platform/InfraDrilldown.tsx) - independent of the domains chain, with its
// own params. architecture-overview/api are narrative pages (markdown+mermaid
// via MarkdownEditor) - no graphs, nothing scoped.
//
// Attachments' owner is projectId directly - platform documentation is 1:1
// with the project (no id of its own), unlike a ticket or sub-project.
// Always available (no isNew/draft concept here - a project's platform
// documentation always exists once the project does).
const PlatformDocumentationSection = ({projectId, projectName, platformDocumentation, onChange}: PlatformDocumentationSectionProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') ?? CATEGORIES[0].id;
  const attachmentBasePath = `/api/project/${projectId}/documentation`;
  const exportTitle = `${projectName} - ${CATEGORIES.find((step) => step.id === activeCategory)?.label ?? ''}`;

  const handleSelect = (id: string) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set('category', id);
        next.delete('domainId');
        next.delete('contextId');
        next.delete('componentId');
        next.delete('clusterId');
        return next;
      },
      {replace: true},
    );
  };

  if (activeCategory === 'architecture-overview') {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4">
        <Stepper steps={CATEGORIES} activeId={activeCategory} onSelect={handleSelect} />
        <MarkdownEditor
          className="min-h-0 flex-1"
          value={platformDocumentation.architectureOverview}
          exportTitle={exportTitle}
          onChange={(architectureOverview) => onChange({...platformDocumentation, architectureOverview})}
          imagePicker={(onSelect) => (
            <AttachmentMediaPicker basePath={attachmentBasePath} label="Platform documentation attachments" onSelect={onSelect} />
          )}
        />
      </div>
    );
  }

  if (activeCategory === 'domains') {
    return (
      <div className="flex flex-col gap-4">
        <Stepper steps={CATEGORIES} activeId={activeCategory} onSelect={handleSelect} />
        <DomainsDrilldown platformDocumentation={platformDocumentation} onChange={onChange} />
      </div>
    );
  }

  if (activeCategory === 'infrastructure') {
    return (
      <div className="flex flex-col gap-4">
        <Stepper steps={CATEGORIES} activeId={activeCategory} onSelect={handleSelect} />
        <InfraDrilldown platformDocumentation={platformDocumentation} onChange={onChange} />
      </div>
    );
  }

  if (activeCategory === 'attachments') {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4">
        <Stepper steps={CATEGORIES} activeId={activeCategory} onSelect={handleSelect} />
        <AttachmentsSection basePath={attachmentBasePath} />
      </div>
    );
  }

  // activeCategory === 'api'
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <Stepper steps={CATEGORIES} activeId={activeCategory} onSelect={handleSelect} />
      <MarkdownEditor
        className="min-h-0 flex-1"
        value={platformDocumentation.api}
        exportTitle={exportTitle}
        onChange={(api) => onChange({...platformDocumentation, api})}
        imagePicker={(onSelect) => (
          <AttachmentMediaPicker basePath={attachmentBasePath} label="Platform documentation attachments" onSelect={onSelect} />
        )}
      />
    </div>
  );
};

export default PlatformDocumentationSection;
