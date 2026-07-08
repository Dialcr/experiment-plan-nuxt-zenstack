import { deleteProject } from "../../lib/project";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  await deleteProject(event, projectId);
  return { success: true };
});
