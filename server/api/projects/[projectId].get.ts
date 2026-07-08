import { getProject } from "../../lib/project";

export default defineEventHandler((event) => {
  const projectId = getRouterParam(event, "projectId")!;
  return getProject(event, projectId);
});
