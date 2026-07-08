import { archiveProject, unarchiveProject } from "../../../lib/project";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const body = await readBody(event);
  if (body.archived) {
    return archiveProject(event, projectId);
  } else {
    return unarchiveProject(event, projectId);
  }
});
