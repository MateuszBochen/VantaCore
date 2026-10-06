import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Plus} from 'lucide-react';
import {PageContainer} from '@/components/ui/page-container';
import {Button} from '@/components/ui/button';
import {useSetModuleTitle} from '../ModuleTitle';
import useListProjectsHook from '@/lib/Project/useListProjectsHook';
import type {ProjectSummary} from '@/lib/Project/Type/types';

// The "Projects" folder item in the sidebar used to have no page of its own
// (link: null), which also left it non-clickable in the breadcrumb - every
// other segment there is a real link. This is that page: nothing but a name
// and a link per project (that's all ProjectSummary carries), same minimal
// shape as BoardsListPage before its own stats were added.
const ProjectsListPage = () => {
  const {listProjects} = useListProjectsHook();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);

  useSetModuleTitle('Projects');

  useEffect(() => {
    let cancelled = false;

    listProjects().then((result) => {
      if (!cancelled && result.success) {
        setProjects(result.projects);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listProjects is a thin useRequestHook wrapper recreated every render
  }, []);

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Projects</p>
        <Button asChild size="sm" leftIcon={<Plus className="h-4 w-4" />}>
          <Link to="/projects/new">New project</Link>
        </Button>
      </div>

      {projects === null ? (
        <p className="text-sm text-muted-foreground">Loading projects…</p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No projects yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="flex items-center gap-2 rounded-xl border border-border bg-card p-4 hover:opacity-80"
            >
              <p className="font-medium text-foreground">{project.name}</p>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
};

export default ProjectsListPage;
