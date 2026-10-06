import type {Project} from './Type/types';

class ProjectCache {
    private static instance: ProjectCache;

    private readonly projects: Map<string, Project> = new Map();

    static getInstance = (): ProjectCache => {
        if (!ProjectCache.instance) {
            ProjectCache.instance = new ProjectCache();
        }

        return ProjectCache.instance;
    }

    private constructor() {
    }

    get = (id: string): Project | null => {
        return this.projects.get(id) ?? null;
    }

    set = (project: Project): void => {
        this.projects.set(project.id, project);
    }
}

export default ProjectCache;

export const projectCache = ProjectCache.getInstance();
