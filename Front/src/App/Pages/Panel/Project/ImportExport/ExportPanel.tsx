import {useState} from 'react';
import {Download} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Combobox} from '@/components/ui/combobox';
import useExportTicketsHook from '@/lib/ImportExport/useExportTicketsHook';
import type {ExportTicketFilters} from '@/lib/ImportExport/Type/types';
import type {Project} from '@/lib/Project/Type/types';

const EMPTY_FILTERS: ExportTicketFilters = {issueTypeIds: [], statusIds: []};

type ExportPanelProps = {
  project: Project;
};

const ExportPanel = ({project}: ExportPanelProps) => {
  const {exportTickets} = useExportTicketsHook();
  const [filters, setFilters] = useState<ExportTicketFilters>(EMPTY_FILTERS);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingFull, setExportingFull] = useState(false);

  const handleExport = (full: boolean) => {
    const setLoading = full ? setExportingFull : setExportingCsv;
    setLoading(true);
    exportTickets(project.id, filters, full).finally(() => setLoading(false));
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Export the current filtered ticket list. CSV is fields only; the full export bundles every ticket's attachments alongside it as a ZIP.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Combobox
          className="max-w-56"
          multiple
          value={filters.issueTypeIds}
          onValueChange={(value) => setFilters((current) => ({...current, issueTypeIds: value}))}
          options={project.issueTypes.map((type) => ({value: type.id, label: type.name}))}
          placeholder="Issue types"
        />
        <Combobox
          className="max-w-56"
          multiple
          value={filters.statusIds}
          onValueChange={(value) => setFilters((current) => ({...current, statusIds: value}))}
          options={project.statuses.map((status) => ({value: status.id, label: status.name}))}
          placeholder="Statuses"
        />
        {(filters.issueTypeIds.length > 0 || filters.statusIds.length > 0) && (
          <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)} className="text-muted-foreground">
            Clear filters
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={() => handleExport(false)} loading={exportingCsv}>
          Export CSV
        </Button>
        <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={() => handleExport(true)} loading={exportingFull}>
          Export with attachments (.zip)
        </Button>
      </div>
    </div>
  );
};

export default ExportPanel;
