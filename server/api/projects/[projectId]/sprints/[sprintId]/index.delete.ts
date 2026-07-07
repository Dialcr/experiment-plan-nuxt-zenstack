import { deleteSprint } from "../../../../../lib/sprint";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const sprintId = getRouterParam(event, "sprintId")!;
  await deleteSprint(event, projectId, sprintId);
  return { success: true };
});
