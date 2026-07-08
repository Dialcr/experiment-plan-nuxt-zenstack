import { updateState, updateStateSchema } from "../../../../lib/state";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const stateId = getRouterParam(event, "stateId")!;
  const body = await readBody(event);
  const data = updateStateSchema.parse(body);
  return updateState(event, projectId, stateId, data);
});
