import { deleteProject } from "../../lib/project";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id")!;
  await deleteProject(event, id);
  return { success: true };
});
