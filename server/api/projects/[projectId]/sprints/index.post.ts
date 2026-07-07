import { createSprint, createSprintSchema } from "../../../../lib/sprint";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const body = await readBody(event);
  const data = createSprintSchema.parse(body);
  return createSprint(event, projectId, data);
});
