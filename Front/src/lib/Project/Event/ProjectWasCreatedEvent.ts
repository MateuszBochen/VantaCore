import type {Project} from '../Type/types';

export class ProjectWasCreatedEvent {
    constructor(public readonly project: Project) {
    }
}
