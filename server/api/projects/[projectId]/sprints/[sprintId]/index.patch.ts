import { updateSprint, updateSprintSchema } from "../../../../../lib/sprint";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const sprintId = getRouterParam(event, "sprintId")!;
  const body = await readBody(event);
  const data = updateSprintSchema.parse(body);
  return updateSprint(event, projectId, sprintId, data);
});
