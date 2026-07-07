import { updateProject, updateProjectSchema } from "../../lib/project";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id")!;
  const body = await readBody(event);
  const data = updateProjectSchema.parse(body);
  return updateProject(event, id, data);
});
