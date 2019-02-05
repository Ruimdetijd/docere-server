import { Project } from '../models';
declare function updateProject(slug: string, props: Partial<Project>): Promise<Project>;
export default updateProject;
