import {useEffect, useState} from 'react';
import {Checkbox} from '@/components/ui/checkbox';
import useListProjectsHook from '@/lib/Project/useListProjectsHook';
import type {ProjectSummary} from '@/lib/Project/Type/types';

type BoardProjectsSectionProps = {
  projectIds: string[];
  onChange: (projectIds: string[]) => void;
};

// Which projects feed tickets into this board - see memory:
// project_vantacore_boards_concept. Every project is eligible (no "already
// on another board" exclusion - a project can feed multiple boards).
const BoardProjectsSection = ({projectIds, onChange}: BoardProjectsSectionProps) => {
  const {listProjects} = useListProjectsHook();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);

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

  const toggle = (projectId: string, checked: boolean) => {
    onChange(checked ? [...projectIds, projectId] : projectIds.filter((id) => id !== projectId));
  };

  if (projects === null) {
    return <p className="text-sm text-muted-foreground">Loading projects…</p>;
  }

  if (projects.length === 0) {
    return <p className="text-sm text-muted-foreground">No projects exist yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">Pick which projects' tickets should appear on this board.</p>

      <div className="flex flex-col gap-1">
        {projects.map((project) => (
          <label
            key={project.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-sm text-foreground"
          >
            <Checkbox
              checked={projectIds.includes(project.id)}
              onCheckedChange={(checked) => toggle(project.id, checked)}
            />
            {project.name}
          </label>
        ))}
      </div>
    </div>
  );
};

export default BoardProjectsSection;
