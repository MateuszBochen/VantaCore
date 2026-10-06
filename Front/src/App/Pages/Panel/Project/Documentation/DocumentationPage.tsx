import {useCallback, useState} from 'react';
import {PageContainer} from '@/components/ui/page-container';
import {Outlet} from 'react-router-dom';
import useProjectFromRoute from '../useProjectFromRoute';
import {useSetModuleTitle} from '../../ModuleTitle';
import type {Project} from '@/lib/Project/Type/types';

export type DocumentationOutletContext = {
  project: Project;
  onProjectChange: (project: Project) => void;
};

// Layout for everything under /projects/:projectId/documentation - owns the
// in-memory project draft and renders whichever child route is active
// (Platform Documentation, or a sub-project's documentation) via Outlet.
// Navigating between those is the sidebar's job now (see Panel/menu.tsx),
// not an in-page Stepper. Saving is each child page's own job too - Platform
// Documentation and each sub-project's documentation persist through their
// own dedicated hook/endpoint (see useSavePlatformDocumentationHook /
// useSaveSubProjectDocumentationHook), not a single Submit button here.
const DocumentationLayout = () => {
  const {project: loadedProject, state} = useProjectFromRoute();
  const [draft, setDraft] = useState<Project | null>(null);
  const [loadedForId, setLoadedForId] = useState<string | null>(null);

  useSetModuleTitle(draft ? `${draft.name} - Documentation` : null);

  // Derived-during-render reset (not an effect): local edits should survive re-renders,
  // but must be replaced wholesale when the loaded project is actually a different one.
  if (loadedProject && loadedProject.id !== loadedForId) {
    setLoadedForId(loadedProject.id);
    setDraft(loadedProject);
  }

  const handleProjectChange = useCallback((project: Project) => {
    setDraft(project);
  }, []);

  if (state === 'loading' || !draft) {
    return <div className="p-8 text-sm text-muted-foreground">Loading project…</div>;
  }

  if (state === 'error') {
    return <div className="p-8 text-sm text-muted-foreground">Couldn't load this project.</div>;
  }

  const outletContext: DocumentationOutletContext = {
    project: draft,
    onProjectChange: handleProjectChange,
  };

  return (
    <PageContainer>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Outlet context={outletContext} />
      </div>
    </PageContainer>
  );
};

export default DocumentationLayout;
