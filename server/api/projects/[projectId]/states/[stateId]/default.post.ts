import { setDefaultState } from "../../../../../lib/state";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "projectId")!;
  const stateId = getRouterParam(event, "stateId")!;
  return setDefaultState(event, projectId, stateId);
});
