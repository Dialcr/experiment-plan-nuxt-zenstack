import { updateProject, updateProjectSchema } from "../../lib/project";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const body = await readBody(event);
  const data = updateProjectSchema.parse(body);
  return updateProject(event, projectId, data);
});
