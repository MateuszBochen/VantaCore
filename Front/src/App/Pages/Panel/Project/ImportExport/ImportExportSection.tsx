import {useMemo} from 'react';
import {useSearchParams} from 'react-router-dom';
import Stepper from '@/components/ui/Stepper';
import type {Project} from '@/lib/Project/Type/types';
import ImportWizard from './ImportWizard';
import ExportPanel from './ExportPanel';

type TabId = 'import' | 'export';

const TABS = [
  {id: 'import', label: 'Import'},
  {id: 'export', label: 'Export'},
];

type ImportExportSectionProps = {
  project: Project;
};

// Lives as the last step of Project Settings, not its own top-level nav
// entry/route (same reasoning as Automation Rules moving into Settings) -
// this is project configuration/tooling, not something browsed day-to-day
// like Tickets or Audit Log.
const ImportExportSection = ({project}: ImportExportSectionProps) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = useMemo<TabId>(() => (searchParams.get('tab') === 'export' ? 'export' : 'import'), [searchParams]);

  const handleTabSelect = (id: string) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set('tab', id);
        return next;
      },
      {replace: true},
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <p className="text-sm font-semibold text-foreground">Import / Export</p>

      <Stepper steps={TABS} activeId={activeTab} onSelect={handleTabSelect} showNumbers={false} />

      {activeTab === 'import' ? <ImportWizard project={project} /> : <ExportPanel project={project} />}
    </div>
  );
};

export default ImportExportSection;
