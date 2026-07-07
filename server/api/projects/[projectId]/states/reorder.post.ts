import { reorderStates, reorderStatesSchema } from "../../../../lib/state";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const body = await readBody(event);
  const data = reorderStatesSchema.parse(body);
  return reorderStates(event, projectId, data);
});
