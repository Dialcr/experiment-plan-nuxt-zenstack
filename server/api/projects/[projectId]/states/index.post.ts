import { createState, createStateSchema } from "../../../../lib/state";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const body = await readBody(event);
  const data = createStateSchema.parse(body);
  return createState(event, projectId, data);
});
