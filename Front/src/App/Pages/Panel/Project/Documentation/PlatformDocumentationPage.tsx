import {useCallback, useState} from 'react';
import {useOutletContext} from 'react-router-dom';
import {Check, ChevronLeft, History} from 'lucide-react';
import {Button} from '@/components/ui/button';
import useSavePlatformDocumentationHook from '@/lib/Project/useSavePlatformDocumentationHook';
import useGetPlatformDocumentationHistoryHook from '@/lib/Project/useGetPlatformDocumentationHistoryHook';
import {toastService} from '@/lib/Toast/ToastService';
import PlatformDocumentationSection from './PlatformDocumentationSection';
import type {DocumentationOutletContext} from './DocumentationPage';
import type {PlatformDocumentation, PlatformDocumentationVersion} from '@/lib/Project/Type/types';

// No-op: the history viewer reuses the same editable graph/markdown widgets
// (no separate read-only renderer exists yet) but nothing typed or dragged
// while browsing history is ever persisted, since this never reaches
// onProjectChange/savePlatformDocumentation.
const ignoreChange = () => {};

const PlatformDocumentationPage = () => {
  const {project, onProjectChange} = useOutletContext<DocumentationOutletContext>();
  const {savePlatformDocumentation} = useSavePlatformDocumentationHook();
  const {getPlatformDocumentationHistory} = useGetPlatformDocumentationHistoryHook();
  const [saving, setSaving] = useState(false);
  const [historyVersion, setHistoryVersion] = useState<PlatformDocumentationVersion | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleChange = (platformDocumentation: PlatformDocumentation) => {
    onProjectChange({...project, platformDocumentation});
  };

  const handleSubmit = useCallback(() => {
    setSaving(true);

    savePlatformDocumentation(project, project.platformDocumentation).finally(() => setSaving(false));
  }, [project, savePlatformDocumentation]);

  // Called both to enter history mode (before = now, so it lands on the most
  // recent saved version) and to step further back (before = that version's
  // own changedAt) - the endpoint always returns the single version strictly
  // older than `before`, there's no bulk history list to page through.
  const loadHistoryBefore = useCallback(
    (before: Date) => {
      setLoadingHistory(true);

      getPlatformDocumentationHistory(project.id, before)
        .then((result) => {
          if (result.success) {
            setHistoryVersion(result.version);
            return;
          }

          toastService.push('error', "No earlier version — this is as far back as it goes.");
        })
        .finally(() => setLoadingHistory(false));
    },
    [project.id, getPlatformDocumentationHistory],
  );

  const handleViewHistory = useCallback(() => loadHistoryBefore(new Date()), [loadHistoryBefore]);

  const handleOlderVersion = useCallback(() => {
    if (historyVersion) {
      loadHistoryBefore(new Date(historyVersion.changedAt));
    }
  }, [historyVersion, loadHistoryBefore]);

  const handleBackToLatest = useCallback(() => setHistoryVersion(null), []);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {historyVersion && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-amber-400/30 bg-amber-400/5 px-4 py-3 text-sm text-amber-200">
          <span>
            Viewing version from {new Date(historyVersion.changedAt).toLocaleString()} by {historyVersion.changedByEmail}
            — read-only.
          </span>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<ChevronLeft className="h-4 w-4" />} onClick={handleOlderVersion} loading={loadingHistory}>
              Older version
            </Button>
            <Button variant="outline" size="sm" onClick={handleBackToLatest}>
              Back to latest
            </Button>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1">
        <PlatformDocumentationSection
          projectId={project.id}
          projectName={project.name}
          platformDocumentation={historyVersion ?? project.platformDocumentation}
          onChange={historyVersion ? ignoreChange : handleChange}
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        {!historyVersion && (
          <Button variant="outline" leftIcon={<History className="h-4 w-4" />} onClick={handleViewHistory} loading={loadingHistory}>
            History
          </Button>
        )}
        <Button leftIcon={<Check className="h-4 w-4" />} onClick={handleSubmit} loading={saving} disabled={!!historyVersion}>
          Submit
        </Button>
      </div>
    </div>
  );
};

export default PlatformDocumentationPage;
