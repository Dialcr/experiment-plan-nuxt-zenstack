import { deleteState } from "../../../../../lib/state";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const stateId = getRouterParam(event, "stateId")!;
  await deleteState(event, projectId, stateId);
  return { success: true };
});
